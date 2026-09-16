/* eslint-disable no-console */
/**
 * Convert a single section's markdown file to its JCR <root> inner content.
 * Runs in its own process so helix-md2jcr starts from clean module state
 * (the converter is not reliably reentrant across many blocks in one process).
 *
 * Usage: node section2jcr.mjs <section-md-file>
 * Prints the inner <root>...</root> XML to stdout, or exits non-zero on failure.
 */
import { readFileSync } from 'fs';

const REPO = '/backups/BansalJitendra/tataaia-ue/repo';
const SCRIPTS = '/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts';
// Resolve helix-md2jcr from the excat scripts' node_modules by absolute path,
// since ESM bare-import resolution is relative to this file, not the cwd.
const { md2jcr } = await import(`${SCRIPTS}/node_modules/@adobe/helix-md2jcr/src/index.js`);
const load = (p) => JSON.parse(readFileSync(p, 'utf-8'));
const modelsRaw = load(`${REPO}/component-models.json`);
const definitionRaw = load(`${REPO}/component-definition.json`);
const filtersRaw = load(`${REPO}/component-filters.json`);
const opts = {
  models: Array.isArray(modelsRaw) ? modelsRaw : (modelsRaw.models || []),
  filters: Array.isArray(filtersRaw) ? filtersRaw : (filtersRaw.filters || []),
  definition: definitionRaw.groups
    ? definitionRaw
    : { groups: [{ title: 'Blocks', id: 'blocks', components: definitionRaw.definitions || definitionRaw }] },
};

const chunk = readFileSync(process.argv[2], 'utf-8');
const xml = await md2jcr(chunk, opts);
const m = xml.match(/<root[^>]*>([\s\S]*?)<\/root>/);
process.stdout.write(m ? m[1].trim() : '');
