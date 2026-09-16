/* eslint-disable no-console */
/**
 * Regenerate migration-work/jcr-content/{index.md,index.xml} for the homepage.
 *
 * Mirrors the bulk-import pipeline but ends in JCR: it injects the helix importer
 * bundle + this project's import bundle into the live page, runs the transform to
 * get the block-table markdown (result.md), then converts that markdown to JCR
 * XML in-browser via WebImporter.md2jcr(md, { components }) so block models are
 * preserved. This is what the "Create content package" UI reads.
 *
 * Run from the excat-content-import scripts dir so playwright resolves:
 *   node tools/importer/generate-jcr.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { execFileSync } from 'child_process';
import { chromium } from 'playwright';
import { md2jcr } from '@adobe/helix-md2jcr';

const REPO = '/backups/BansalJitendra/tataaia-ue/repo';
const SCRIPTS = '/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts';
const URL = 'https://www.tataaia.com/';
const OUT_DIR = `${REPO}/migration-work/jcr-content`;

const helixImporterScript = readFileSync(`${SCRIPTS}/static/inject/helix-importer.js`, 'utf-8');
const importScriptContent = readFileSync(`${REPO}/tools/importer/import-home.bundle.js`, 'utf-8');

const loadJson = (p) => JSON.parse(readFileSync(p, 'utf-8'));
// component-models.json and component-filters.json are top-level arrays;
// component-definition.json is a { definitions: [...] } (or { groups }) object.
const modelsRaw = loadJson(`${REPO}/component-models.json`);
const definitionRaw = loadJson(`${REPO}/component-definition.json`);
const filtersRaw = loadJson(`${REPO}/component-filters.json`);
const models = Array.isArray(modelsRaw) ? modelsRaw : (modelsRaw.models || []);
const filters = Array.isArray(filtersRaw) ? filtersRaw : (filtersRaw.filters || []);
const definition = definitionRaw.groups
  ? definitionRaw
  : { groups: [{ title: 'Blocks', id: 'blocks', components: definitionRaw.definitions || definitionRaw }] };

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(2000);

  await page.evaluate((script) => {
    const scriptEl = document.createElement('script');
    scriptEl.textContent = script;
    document.head.appendChild(scriptEl);
  }, helixImporterScript);
  await page.evaluate((script) => {
    const scriptEl = document.createElement('script');
    scriptEl.textContent = script;
    document.head.appendChild(scriptEl);
  }, importScriptContent);
  await page.waitForFunction(
    () => typeof window.CustomImportScript !== 'undefined' && window.CustomImportScript?.default,
    { timeout: 15000 },
  );

  // Capture the block-table markdown from the live page via our import bundle.
  const md = await page.evaluate(async (pageUrl) => {
    const cfg = window.CustomImportScript.default;
    if (cfg.onLoad) await cfg.onLoad({ document });
    const mdResult = await window.WebImporter.html2md(pageUrl, document, cfg, {
      toDocx: false, toMd: true, originalURL: pageUrl,
    });
    return mdResult.md;
  }, URL);
  await browser.close();

  writeFileSync(`${OUT_DIR}/index.md`, md, 'utf-8');

  const opts = { models, definition, filters };
  const META = '\n\n+---+\n| Metadata |\n+===+\n| Title | T |\n+---+\n';
  const escapeAmp = (s) => s.replace(/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[0-9a-fA-F]+;)/g, '&amp;');

  // Separate the trailing image-reference definitions ("[imageN]: url") and the
  // page Metadata table from the body — both are appended to each per-section
  // conversion so links/images resolve and md2jcr treats each chunk as a page.
  const refMatch = md.match(/\n\[image\d+\]:[\s\S]*$/);
  const imageRefs = refMatch ? refMatch[0] : '';
  let body = refMatch ? md.slice(0, refMatch.index) : md;

  // Pull the page Metadata table out of the body (keep it for page-level props).
  const metaMatch = body.match(/\n\+[-+]+\n\|\s*Metadata[\s\S]*?\n\+[-+]+\n(?=\s*$)/);
  const metadataTable = metaMatch ? metaMatch[0] : '';
  if (metaMatch) body = body.slice(0, metaMatch.index);

  // Split the body into sections on the EDS section separator (--- on its own line).
  let sections = body.split(/\n---\n/).map((s) => s.trim()).filter(Boolean);

  // A few source sections merge blocks that md2jcr can't process together in one
  // pass (a cumulative-state limitation — e.g. Tabs Links immediately followed by
  // the Disclaimers accordion). Only when a whole section fails to convert do we
  // fall back to splitting it at Accordion List boundaries and converting the
  // pieces separately; well-formed sections are left intact.
  const splitAtAccordions = (sec) => {
    const parts = sec.split(/\n(?=\+[-]{3,}\+?\n\| Accordion List )/);
    return parts.map((p) => p.trim()).filter(Boolean);
  };

  // Convert each section on its own (all sections convert cleanly in isolation),
  // then extract its inner <section...>...</section> node(s).
  // Append only the image-reference definitions a chunk actually uses, so md2jcr
  // resolves them without emitting orphan "definition" nodes for other sections' refs.
  const refsFor = (chunk) => [...new Set([...chunk.matchAll(/\]\[(image\d+)\]/g)].map((m) => m[1]))]
    .map((id) => (imageRefs.match(new RegExp(`\\n\\[${id}\\]:[^\\n]*`)) || [''])[0])
    .join('');
  // Convert each chunk in its OWN process: helix-md2jcr accumulates module-level
  // state across calls (a block that converts alone can fail after ~18 prior
  // conversions in the same process). A fresh subprocess per section avoids that.
  const tmpMd = `${OUT_DIR}/.section.tmp.md`;
  const sectionCli = `${REPO}/tools/importer/section2jcr.mjs`;
  const convertChunk = (chunk) => {
    writeFileSync(tmpMd, `${chunk}\n${refsFor(chunk)}${META}`, 'utf-8');
    const frag = execFileSync('node', [sectionCli, tmpMd], {
      cwd: SCRIPTS, encoding: 'utf-8', maxBuffer: 64 * 1024 * 1024,
    });
    return frag && frag.trim() ? frag.trim() : null;
  };

  const sectionXmls = [];
  for (let i = 0; i < sections.length; i += 1) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const frag = await convertChunk(sections[i]);
      if (frag) sectionXmls.push(frag);
    } catch (e) {
      // Whole section failed — split it at accordion boundaries and convert pieces.
      const pieces = splitAtAccordions(sections[i]);
      if (pieces.length > 1) {
        for (let k = 0; k < pieces.length; k += 1) {
          try {
            // eslint-disable-next-line no-await-in-loop
            const frag = await convertChunk(pieces[k]);
            if (frag) sectionXmls.push(frag);
          } catch (e2) {
            // Last-resort retry: drop inline image references from the chunk. Some
            // rich accordion answers (e.g. Disclaimers, with embedded chart images
            // inside a long list) overflow md2jcr's single richtext field only when
            // the images resolve; without them the text/list content still converts.
            try {
              const noImg = pieces[k].replace(/!?\[[^\]]*\]\[image\d+\]/g, '').replace(/!\[[^\]]*\]\([^)]*\)/g, '');
              // eslint-disable-next-line no-await-in-loop
              const frag = await convertChunk(noImg);
              if (frag) { sectionXmls.push(frag); continue; }
            } catch (e3) { /* fall through to reporting */ }
            writeFileSync(`${OUT_DIR}/.fail_s${i}_p${k}.md`, `${pieces[k]}\n${refsFor(pieces[k])}${META}`, 'utf-8');
            const stderr = (e2.stderr || '').toString().split('\n').filter(Boolean).slice(-3).join(' ');
            console.error(`SECTION ${i} piece ${k} FAILED: ${stderr.slice(0, 120)}`);
          }
        }
      } else {
        console.error(`SECTION ${i} FAILED: ${String(e.message).split('\n')[0].slice(0, 55)}`);
      }
    }
  }

  // Page-level jcr:content attributes come from converting the Metadata table alone.
  let pageContentAttrs = 'cq:template="/libs/core/franklin/templates/page" sling:resourceType="core/franklin/components/page/v1/page" jcr:primaryType="cq:PageContent"';
  if (metadataTable) {
    const metaXml = await md2jcr(`# _\n\n${metadataTable}`, opts);
    const m = metaXml.match(/<jcr:content ([^>]*)>/);
    if (m) pageContentAttrs = m[1];
  }

  // Reassemble into a single crosswalk page. Each fragment is the inner content
  // of a single-section page's <root> — i.e. one or more <section...>...</section>
  // nodes named "section"/"section_N". Give every top-level section a unique,
  // matched open/close name (section, section_1, ...) so the merged doc is
  // well-formed. Only the OUTERMOST section tags of each fragment are renamed;
  // block/item nodes inside are untouched.
  let sectionIdx = 0;
  const renumbered = sectionXmls.map((frag) => {
    // normalise each fragment's own section tags to plain <section>...</section>
    const norm = frag
      .replace(/<section_\d+\b/g, '<section')
      .replace(/<\/section_\d+>/g, '</section>');
    // then assign a unique suffix to each matched pair at the top level
    return norm.replace(/<section\b([^>]*)>([\s\S]*?)<\/section>/g, (m, attrs, inner) => {
      const name = sectionIdx === 0 ? 'section' : `section_${sectionIdx}`;
      sectionIdx += 1;
      return `<${name}${attrs}>${inner}</${name}>`;
    });
  });

  const xml = escapeAmp(`<?xml version="1.0" encoding="UTF-8"?>
<jcr:root xmlns:jcr="http://www.jcp.org/jcr/1.0" xmlns:nt="http://www.jcp.org/jcr/nt/1.0" xmlns:cq="http://www.day.com/jcr/cq/1.0" xmlns:sling="http://sling.apache.org/jcr/sling/1.0" jcr:primaryType="cq:Page">
  <jcr:content ${pageContentAttrs}>
    <root jcr:primaryType="nt:unstructured" sling:resourceType="core/franklin/components/root/v1/root">
      ${renumbered.join('\n      ')}
    </root>
  </jcr:content>
</jcr:root>
`);

  writeFileSync(`${OUT_DIR}/index.xml`, xml, 'utf-8');
  console.log(`wrote index.md (${md.length}) + index.xml (${xml.length}) from ${sectionXmls.length} sections`);
}

main().catch((e) => { console.error(e); process.exit(1); });
