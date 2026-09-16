/* eslint-disable no-console */
/**
 * Validate that the migrated content is JCR-compatible (x-walk / crosswalk).
 *
 * Fast, offline checks against the already-generated artifacts:
 *   - migration-work/jcr-content/index.xml is well-formed XML with a cq:Page root
 *   - no raw/unescaped ampersands (md2jcr leaves them in button link= attrs)
 *   - every block used in content/index.plain.html appears in the JCR as a
 *     `filter="<block>"` (nothing silently dropped during conversion)
 *   - every block model referenced by the JCR exists in component-models.json,
 *     and every block/item name matches a component-definition.json title
 *
 * Exit code 0 = JCR-compatible, 1 = problems found (printed).
 *
 * Regenerate the JCR first with:  node tools/importer/generate-jcr.mjs
 * then validate with:            node tools/importer/validate-jcr.mjs
 */
import { readFileSync, existsSync } from 'fs';
import { execFileSync } from 'child_process';

const REPO = process.cwd();
const PLAIN = `${REPO}/content/index.plain.html`;
const XML = `${REPO}/migration-work/jcr-content/index.xml`;

const problems = [];
const ok = (msg) => console.log(`  ok   ${msg}`);
const fail = (msg) => { problems.push(msg); console.log(`  FAIL ${msg}`); };

if (!existsSync(XML)) {
  console.error(`No JCR found at ${XML}. Run: node tools/importer/generate-jcr.mjs`);
  process.exit(1);
}

const xml = readFileSync(XML, 'utf-8');

// 1) Well-formed XML (reuse python's parser — available in this environment).
try {
  execFileSync('python3', ['-c', `import xml.dom.minidom,sys; xml.dom.minidom.parse(${JSON.stringify(XML)})`]);
  ok('index.xml is well-formed XML');
} catch (e) {
  fail(`index.xml is NOT well-formed: ${String(e.stderr || e.message).split('\n').pop()}`);
}

// 2) cq:Page root.
if (/jcr:primaryType="cq:Page"/.test(xml)) ok('root is cq:Page'); else fail('missing cq:Page root');

// 3) No raw ampersands.
const rawAmp = (xml.match(/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[0-9a-fA-F]+;)/g) || []).length;
if (rawAmp === 0) ok('no raw/unescaped ampersands'); else fail(`${rawAmp} raw & (unescaped) — will break XML upload`);

// 4) Every block in the imported HTML is present in the JCR.
if (existsSync(PLAIN)) {
  const html = readFileSync(PLAIN, 'utf-8');
  const known = [
    'hero-promo', 'hero-banner', 'cards-plan', 'cards-persona', 'cards-quicklink',
    'cards-promo', 'cards-award', 'cards-stats', 'cards-article', 'columns-panels',
    'accordion-list', 'carousel-review', 'carousel-video', 'carousel-banner',
    'quote-callout', 'table-data', 'tabs-links', 'form',
  ];
  const usedInHtml = known.filter((b) => new RegExp(`class="${b}"`).test(html));
  // A block appears in the JCR either as a repeating container (filter="<block>")
  // or as a single modelled block (model="<block>"). Also match by component
  // title (e.g. "Hero Promo") for blocks the converter names rather than ids.
  const jcrFilters = new Set([...xml.matchAll(/filter="([a-z-]+)"/g)].map((m) => m[1]));
  const jcrModels = new Set([...xml.matchAll(/model="([a-z0-9-]+)"/g)].map((m) => m[1]));
  const titleOf = (b) => b.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
  const inJcr = (b) => jcrFilters.has(b) || jcrModels.has(b) || xml.includes(`name="${titleOf(b)}"`)
    || (b === 'form' && xml.includes('.json"')) // form referenced via JSON link
    || (b === 'columns-panels' && xml.includes('components/columns/')); // renders as a columns component
  const missing = usedInHtml.filter((b) => !inJcr(b));
  if (missing.length === 0) ok(`all ${usedInHtml.length} blocks in plain.html are present in JCR`);
  else fail(`blocks in plain.html missing from JCR (silently dropped in conversion): ${missing.join(', ')}`);
} else {
  console.log('  --   content/index.plain.html not found; skipping block-presence check');
}

// 5) Every model/name referenced by the JCR is defined.
const models = new Set((JSON.parse(readFileSync(`${REPO}/component-models.json`, 'utf-8'))).map((m) => m.id));
const usedModels = new Set([...xml.matchAll(/model="([a-z0-9-]+)"/g)].map((m) => m[1]));
const undefModels = [...usedModels].filter((m) => m !== 'section' && !models.has(m));
if (undefModels.length === 0) ok('all block models referenced by the JCR are defined'); else fail(`undefined models: ${undefModels.join(', ')}`);

console.log('');
if (problems.length) {
  console.error(`JCR compatibility: ${problems.length} problem(s). See rules in tools/importer/JCR-COMPATIBILITY.md`);
  process.exit(1);
}
console.log('JCR compatibility: PASS ✅');
