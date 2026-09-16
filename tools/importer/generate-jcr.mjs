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
  // Convert markdown -> JCR XML in Node (same as the host md2jcr pipeline).
  const jcr = await md2jcr(md, { models, definition, filters });
  const out = { md, jcr };

  await browser.close();

  writeFileSync(`${OUT_DIR}/index.md`, out.md, 'utf-8');
  let xml = out.jcr;
  xml = xml.replace(/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[0-9a-fA-F]+;)/g, '&amp;');
  writeFileSync(`${OUT_DIR}/index.xml`, xml, 'utf-8');
  console.log(`wrote index.md (${out.md.length}) + index.xml (${xml.length})`);
}

main().catch((e) => { console.error(e); process.exit(1); });
