# DAM asset upload bundle — tataaia-ue

66 image assets that the homepage references but which are **not yet in AEM DAM**,
which is why images are broken on the delivery page
(`https://main--tataaia-ue--bansaljitendra.aem.page/`). Sync uploads page content
(JCR) only — asset binaries must be uploaded to AEM Assets separately.

## What's here

```
tata-aia-dam-content-package.zip   ← INSTALLABLE AEM content package (recommended)
content/dam/tata-aia/...           ← the 66 raw images (loose tree)
tata-aia-dam-assets.zip            ← the loose tree zipped (for drag/drop uploaders)
MANIFEST.tsv                       ← DAM path → source URL
```

### Recommended: install the content package (one action, bundles all assets)

`tata-aia-dam-content-package.zip` is a **FileVault content package** — the same
package format AEM uses for content sync. It contains every image as a proper
`dam:Asset` under `/content/dam/tata-aia/...` plus `META-INF/vault/filter.xml`
(filter root `/content/dam/tata-aia`).

Install it in ONE step:
- **AEM Package Manager** (`/crx/packmgr`): Upload Package → select the zip →
  Install. All 66 assets are created under `/content/dam/tata-aia`.
- Rebuild it any time with: `node tools/importer/build-dam-package.mjs`

This is the closest thing to "assets as part of the sync": it's a content package
you install alongside the page-content package, so both the pages and their images
land in AEM together.

The folder tree **mirrors the exact target DAM paths**. Every file's location under
`content/dam/tata-aia/` is where it must land in AEM Assets.

- 51 PNG, 13 JPG, 2 SVG — all verified valid images, none over 40 KB, none empty.

## How to import into AEM Assets

Target root: **`/content/dam/tata-aia`** (the project's `aemAssetsFolderPath`).

Pick whichever matches your access:

1. **AEM Assets UI (drag & drop / bulk upload)**
   - In AEM Assets, navigate to `/content/dam/tata-aia`.
   - Upload the `tataaialifeinsurancecompanylimited` folder from this bundle
     (Create → Files/Folder, or drag the folder in). Keep the folder structure —
     AEM preserves subfolders on folder upload.

2. **AEM Assets folder upload from disk**
   - Point the uploader at `content/dam/tata-aia/tataaialifeinsurancecompanylimited`
     and upload into `/content/dam/tata-aia/`.

3. **Scripted (AEM Assets HTTP API)**
   - `AEM_TOKEN="<ims-token>" node tools/importer/upload-dam-assets.mjs`
     (needs an authenticated IMS token for the author instance).

## After upload

1. Confirm a sample resolves, e.g.
   `https://author-.../content/dam/tata-aia/tataaialifeinsurancecompanylimited/Homepage-carousel-banner/Desktop_Homepage-banner-Shield-image.png`
2. Re-Sync / publish the homepage so the pages pick up the now-present assets.
3. The **logo** is included at
   `.../navigations/new-navigation-icon/Mobile-25-logo.svg`. Once uploaded, tell me
   and I'll point `nav.xml` at that DAM path (instead of the own-origin `/assets/`
   path that currently renders `about:error`).
