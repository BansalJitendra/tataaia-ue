/*
 * Build a FileVault content package (.zip) containing all staged DAM assets so
 * they can be installed into AEM in ONE upload via CRX Package Manager — i.e.
 * bundled alongside the page-content sync instead of a separate per-file upload.
 *
 * Input:  migration-work/dam-upload/content/dam/tata-aia/**   (66 image binaries)
 * Output: migration-work/dam-upload/tata-aia-dam-content-package.zip
 *
 * Package layout (FileVault):
 *   jcr_root/content/dam/tata-aia/.content.xml            (sling:OrderedFolder)
 *   jcr_root/content/dam/tata-aia/<path>/<file>           (binary)
 *   jcr_root/content/dam/tata-aia/<path>/<file>.dir/.content.xml   (dam:Asset node)
 *   META-INF/vault/filter.xml                             (filter: /content/dam/tata-aia)
 *   META-INF/vault/properties.xml                         (package name/group/version)
 *
 * Install: AEM → CRX/DE Package Manager → Upload Package → Install. This creates
 * every /content/dam/tata-aia/... asset so the synced pages resolve their images.
 */
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative, dirname, basename } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
// Reuse the archiver-free zip: use the zip lib bundled with helix scripts if present,
// else fall back to Node's zlib-based store. We use a minimal ZIP writer here.
const SCRIPTS = '/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts';

const REPO = '/backups/BansalJitendra/tataaia-ue/repo';
// v2: paths lowercased to match AEM's folder-name sanitization (what the synced
// pages actually request). Verified 26/26 deployed paths reproduced.
const SRC = `${REPO}/migration-work/dam-upload-v2/content/dam/tata-aia`;
const OUT = `${REPO}/migration-work/dam-upload-v2/tata-aia-dam-content-package.zip`;
const DAM_ROOT = 'content/dam/tata-aia';

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

// Exclude assets AEM's publish replication rejects or that are build leftovers:
//  - SVGs over the 40KB publish limit (a raster replacement is referenced instead)
//  - stray temp .png renders left beside a replaced asset
const SVG_LIMIT = 40 * 1024;
const files = walk(SRC).filter((p) => {
  const lower = p.toLowerCase();
  if (lower.endsWith('.svg') && statSync(p).size > SVG_LIMIT) return false;
  if (lower.endsWith('slider1.png')) return false; // temp render; slider1.jpg is used
  return true;
});

const FOLDER_CONTENT = `<?xml version="1.0" encoding="UTF-8"?>
<jcr:root xmlns:jcr="http://www.jcp.org/jcr/1.0" xmlns:nt="http://www.jcp.org/jcr/nt/1.0"
    jcr:primaryType="sling:OrderedFolder"/>
`;

// A FileVault dam:Asset aggregate. The asset node is a folder on disk; its
// .content.xml declares the dam:Asset tree, and the original rendition's binary
// is stored as the nt:file at <asset>/_jcr_content/renditions/original.
function assetContentXml(mime) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<jcr:root xmlns:jcr="http://www.jcp.org/jcr/1.0" xmlns:nt="http://www.jcp.org/jcr/nt/1.0"
    xmlns:dam="http://www.day.com/dam/1.0"
    jcr:primaryType="dam:Asset">
  <jcr:content jcr:primaryType="dam:AssetContent">
    <renditions jcr:primaryType="nt:folder">
      <original jcr:primaryType="nt:file">
        <jcr:content jcr:primaryType="nt:resource" jcr:mimeType="${mime}"/>
      </original>
    </renditions>
  </jcr:content>
</jcr:root>
`;
}

const FILTER_XML = `<?xml version="1.0" encoding="UTF-8"?>
<workspaceFilter version="1.0">
  <filter root="/content/dam/tata-aia"/>
</workspaceFilter>
`;

const PROPERTIES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE properties SYSTEM "http://java.sun.com/dtd/properties.dtd">
<properties>
  <entry key="name">tata-aia-dam-assets</entry>
  <entry key="group">tataaia-ue</entry>
  <entry key="version">1.0</entry>
  <entry key="createdBy">excat-migration</entry>
  <entry key="description">Homepage DAM assets (66 images) for /content/dam/tata-aia</entry>
</properties>
`;

// --- minimal ZIP (store, no compression) writer ---
function crc32(buf) {
  let c; const table = crc32.t || (crc32.t = (() => {
    const t = [];
    for (let n = 0; n < 256; n += 1) {
      c = n;
      for (let k = 0; k < 8; k += 1) c = c & 1 ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      t[n] = c >>> 0;
    }
    return t;
  })());
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i += 1) crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

const entries = [];
function addEntry(name, dataBuf) {
  entries.push({ name, data: Buffer.isBuffer(dataBuf) ? dataBuf : Buffer.from(dataBuf, 'utf-8') });
}

// Package metadata
addEntry('META-INF/vault/filter.xml', FILTER_XML);
addEntry('META-INF/vault/properties.xml', PROPERTIES_XML);
addEntry(`jcr_root/${DAM_ROOT}/.content.xml`, FOLDER_CONTENT);

// Each asset: binary + <file>.dir/.content.xml marking it a dam:Asset.
// Also add folder .content.xml for each intermediate dir as sling:OrderedFolder.
const seenDirs = new Set();
for (const f of files) {
  const rel = relative(SRC, f); // tataaialifeinsurancecompanylimited/...
  // ensure folder nodes
  const parts = dirname(rel).split('/');
  let cur = '';
  for (const part of parts) {
    cur = cur ? `${cur}/${part}` : part;
    if (!seenDirs.has(cur)) {
      seenDirs.add(cur);
      addEntry(`jcr_root/${DAM_ROOT}/${cur}/.content.xml`, FOLDER_CONTENT);
    }
  }
  const bytes = readFileSync(f);
  const ext = rel.slice(rel.lastIndexOf('.')).toLowerCase();
  const mime = MIME[ext] || 'application/octet-stream';
  // dam:Asset aggregate: the asset node's .content.xml + the original rendition binary.
  addEntry(`jcr_root/${DAM_ROOT}/${rel}/.content.xml`, assetContentXml(mime));
  addEntry(`jcr_root/${DAM_ROOT}/${rel}/_jcr_content/renditions/original`, bytes);
}

// Write ZIP (store method 0)
const chunks = [];
const central = [];
let offset = 0;
for (const e of entries) {
  const nameBuf = Buffer.from(e.name, 'utf-8');
  const crc = crc32(e.data);
  const size = e.data.length;
  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4);
  local.writeUInt16LE(0, 6);
  local.writeUInt16LE(0, 8); // store
  local.writeUInt16LE(0, 10);
  local.writeUInt16LE(0, 12);
  local.writeUInt32LE(crc, 14);
  local.writeUInt32LE(size, 18);
  local.writeUInt32LE(size, 22);
  local.writeUInt16LE(nameBuf.length, 26);
  local.writeUInt16LE(0, 28);
  chunks.push(local, nameBuf, e.data);
  const cd = Buffer.alloc(46);
  cd.writeUInt32LE(0x02014b50, 0);
  cd.writeUInt16LE(20, 4);
  cd.writeUInt16LE(20, 6);
  cd.writeUInt16LE(0, 8);
  cd.writeUInt16LE(0, 10);
  cd.writeUInt16LE(0, 12);
  cd.writeUInt16LE(0, 14);
  cd.writeUInt32LE(crc, 16);
  cd.writeUInt32LE(size, 20);
  cd.writeUInt32LE(size, 24);
  cd.writeUInt16LE(nameBuf.length, 28);
  cd.writeUInt16LE(0, 30);
  cd.writeUInt16LE(0, 32);
  cd.writeUInt16LE(0, 34);
  cd.writeUInt16LE(0, 36);
  cd.writeUInt32LE(0, 38);
  cd.writeUInt32LE(offset, 42);
  central.push(Buffer.concat([cd, nameBuf]));
  offset += local.length + nameBuf.length + e.data.length;
}
const centralBuf = Buffer.concat(central);
const end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50, 0);
end.writeUInt16LE(entries.length, 8);
end.writeUInt16LE(entries.length, 10);
end.writeUInt32LE(centralBuf.length, 12);
end.writeUInt32LE(offset, 16);
const zip = Buffer.concat([...chunks, centralBuf, end]);

const { writeFileSync } = require('fs');
writeFileSync(OUT, zip);
console.log(`Wrote ${OUT}`);
console.log(`Assets: ${files.length}, ZIP entries: ${entries.length}, size: ${Math.round(zip.length / 1024)} KB`);
