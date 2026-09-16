/*
 * Upload the staged DAM asset bundle (migration-work/dam-upload/content/dam/tata-aia/**)
 * into the project's AEM Cloud author instance at /content/dam/tata-aia, using the
 * AEM Assets HTTP API (initiateUpload -> binary PUT -> completeUpload).
 *
 * AUTH: this AEM Cloud author instance uses Adobe IMS. Provide a bearer token via
 * the AEM_TOKEN env var (do NOT hardcode a secret). Run:
 *   AEM_TOKEN="$MY_TOKEN" node tools/importer/upload-dam-assets.mjs
 * If AEM_TOKEN is unset, the script prints what it would upload and exits (dry run).
 *
 * The folder tree under BUNDLE mirrors the target DAM path exactly, so each local
 * file maps 1:1 to its /content/dam/... destination.
 */
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative, basename, dirname } from 'path';

const AEM = 'https://author-p121857-e1377564.adobeaemcloud.com';
const REPO = '/backups/BansalJitendra/tataaia-ue/repo';
const BUNDLE = `${REPO}/migration-work/dam-upload/content/dam/tata-aia`;
const DAM_ROOT = '/content/dam/tata-aia';
const TOKEN = process.env.AEM_TOKEN || '';

const MIME = {
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.gif': 'image/gif', '.webp': 'image/webp', '.avif': 'image/avif',
};

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

const files = walk(BUNDLE);
const authHeaders = { Authorization: `Bearer ${TOKEN}` };

async function ensureFolder(damPath) {
  // Create the DAM folder (idempotent). AEM returns 409 if it already exists.
  const parent = dirname(damPath);
  const name = basename(damPath);
  const res = await fetch(`${AEM}/api/assets${parent}/*`, {
    method: 'POST',
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ class: 'assetFolder', properties: { name } }),
  }).catch((e) => ({ ok: false, status: 0, statusText: String(e) }));
  return res.status;
}

async function uploadOne(localPath) {
  const rel = relative(BUNDLE, localPath); // tataaialifeinsurancecompanylimited/...
  const damDir = `${DAM_ROOT}/${dirname(rel)}`;
  const fileName = basename(localPath);
  const ext = fileName.slice(fileName.lastIndexOf('.')).toLowerCase();
  const mime = MIME[ext] || 'application/octet-stream';
  const bytes = readFileSync(localPath);

  // 1) initiateUpload
  const init = await fetch(`${AEM}/content/dam/tata-aia.initiateUpload.json`, {
    method: 'POST',
    headers: { ...authHeaders, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ path: damDir, fileName, fileSize: String(bytes.length) }),
  });
  if (!init.ok) throw new Error(`initiateUpload ${init.status} for ${rel}`);
  const meta = await init.json();
  const target = meta.files?.[0];
  const uploadUri = target?.uploadURIs?.[0];
  const completeUri = meta.completeURI;
  if (!uploadUri || !completeUri) throw new Error(`no upload URIs for ${rel}`);

  // 2) PUT binary to blob store
  const put = await fetch(uploadUri, { method: 'PUT', body: bytes });
  if (!put.ok) throw new Error(`PUT blob ${put.status} for ${rel}`);

  // 3) completeUpload
  const done = await fetch(`${AEM}${completeUri}`, {
    method: 'POST',
    headers: { ...authHeaders, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      fileName, mimeType: mime, uploadToken: target.uploadToken,
    }),
  });
  if (!done.ok) throw new Error(`completeUpload ${done.status} for ${rel}`);
  return `${damDir}/${fileName}`;
}

async function main() {
  console.log(`Bundle: ${BUNDLE}`);
  console.log(`Files: ${files.length}`);
  if (!TOKEN) {
    console.log('\nDRY RUN (no AEM_TOKEN set). Would upload:');
    files.forEach((f) => console.log(`  ${DAM_ROOT}/${relative(BUNDLE, f)}`));
    console.log('\nSet AEM_TOKEN and re-run to upload.');
    return;
  }
  // Ensure folders exist (deepest paths — create parents first, best effort).
  const dirs = [...new Set(files.map((f) => `${DAM_ROOT}/${dirname(relative(BUNDLE, f))}`))].sort();
  for (const d of dirs) {
    const parts = d.replace(`${DAM_ROOT}/`, '').split('/');
    let cur = DAM_ROOT;
    for (const part of parts) { cur = `${cur}/${part}`; /* eslint-disable-next-line no-await-in-loop */ await ensureFolder(cur); }
  }
  let ok = 0; const errors = [];
  for (const f of files) {
    try { /* eslint-disable-next-line no-await-in-loop */ const p = await uploadOne(f); ok += 1; console.log(`  ✓ ${p}`); }
    catch (e) { errors.push(String(e.message || e)); console.log(`  ✗ ${e.message || e}`); }
  }
  console.log(`\nUploaded ${ok}/${files.length}. Errors: ${errors.length}`);
  process.exit(errors.length ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
