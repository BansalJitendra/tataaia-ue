/* eslint-disable no-console */
/**
 * Regenerate the JCR content for the homepage from the imported plain HTML.
 *
 * Reads content/index.plain.html and converts it straight to JCR XML using the
 * project's component models (block divs -> JCR block nodes), writing:
 *   migration-work/jcr-content/index.xml
 *
 * This is what the "Create content package" UI reads. Run after any reimport
 * that changed content/index.plain.html.
 *
 * Usage (from the excat-content-import scripts dir so bare imports resolve):
 *   node tools/importer/convert-to-jcr.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { JSDOM } from 'jsdom';
import { md2jcr } from '@adobe/helix-importer';

const REPO = '/backups/BansalJitendra/tataaia-ue/repo';
const PLAIN = `${REPO}/content/index.plain.html`;
const OUT_DIR = `${REPO}/migration-work/jcr-content`;
const URL = 'https://www.tataaia.com/';

const loadJson = (p) => JSON.parse(readFileSync(p, 'utf-8'));

// Component model bundle the JCR converter needs (models/definition/filters).
const modelsRaw = loadJson(`${REPO}/component-models.json`);
const definitionRaw = loadJson(`${REPO}/component-definition.json`);
const filtersRaw = loadJson(`${REPO}/component-filters.json`);
const definition = definitionRaw.groups
  ? definitionRaw
  : { groups: [{ title: 'Blocks', id: 'blocks', components: definitionRaw.definitions || [] }] };
const components = {
  models: modelsRaw.models || modelsRaw,
  definition,
  filters: filtersRaw.filters || filtersRaw,
};

// The plain.html is a content fragment; wrap in a full page doc with <main>.
const fragment = readFileSync(PLAIN, 'utf-8');
const pageHtml = `<!DOCTYPE html><html><head><title>Tata AIA</title></head><body><main>${fragment}</main></body></html>`;

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  const dom = new JSDOM(pageHtml);
  const { document } = dom.window;

  // md2jcr(url, document, transformCfg, config, params) — converts the HTML DOM
  // (block divs intact) to JCR, using the component models from params.
  const res = await md2jcr(
    URL,
    document,
    {},
    { setBackgroundImagesFromCSS: false },
    { components },
  );

  // Result shape: object with .jcr (string) or array of resources.
  let xml = null;
  if (typeof res === 'string') xml = res;
  else if (res && res.jcr) xml = res.jcr;
  else if (Array.isArray(res) && res[0]) xml = res[0].jcr || res[0].content || res[0].md;
  if (!xml) {
    console.error('md2jcr returned unexpected shape:', Object.keys(res || {}));
    process.exit(2);
  }

  // Escape any raw & left in link attributes so the XML is well-formed.
  xml = xml.replace(/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[0-9a-fA-F]+;)/g, '&amp;');
  writeFileSync(`${OUT_DIR}/index.xml`, xml, 'utf-8');
  console.log(`wrote index.xml (${xml.length} chars)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
