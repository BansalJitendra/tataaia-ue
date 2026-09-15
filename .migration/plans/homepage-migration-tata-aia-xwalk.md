# Homepage Migration Plan — tata-aia (Crosswalk / X-Walk)

## Overview
Migrate the **full homepage** of `https://www.tataaia.com/` into this AEM Edge Delivery Services **Crosswalk (X-Walk)** project. Because this is an X-Walk project, content is authored in AEM Author and stored in **JCR** (`/content/tata-aia`), with assets in `/content/dam/tata-aia`. The migration therefore covers scraping, structural analysis, block mapping/generation, design styling, header/nav + footer instrumentation, and conversion of imported HTML into **JCR XML** for upload to AEM Author.

## Project Context (confirmed from repo)
- **Type:** Crosswalk (X-Walk) — Universal Editor + JCR content model
- **AEM Author:** `author-p121857-e1377564.adobeaemcloud.com`
- **Site path:** `/content/tata-aia` · **Assets:** `/content/dam/tata-aia`
- **Preview org/site:** `bansaljitendra` / `tataaia-ue`
- **Existing blocks:** accordion, cards, carousel, columns, embed, footer, form, fragment, header, hero, modal, quote, search, table, tabs, video
- **Component models present:** `component-definition.json`, `component-models.json`, `component-filters.json` (must be kept in sync for any new/modified block)
- **Prior work:** footer already partially staged (`migration-work/jcr-content/footer.xml`, `content/footer.plain.html`)

## Scope
- ✅ Homepage main content sections
- ✅ Header / navigation instrumentation
- ✅ Footer instrumentation (reconcile with existing partial footer work)
- ✅ Conversion to JCR XML + upload to AEM Author

## Checklist

### Phase 1 — Project & Source Setup
- [ ] Confirm project type and X-Walk specifics via project-expert (block library endpoint, JCR conventions)
- [ ] Scrape `https://www.tataaia.com/` — capture cleaned HTML, metadata, screenshots, and download images
- [ ] Verify scrape completeness against the live page (hero, product/plan sections, promos, footer)

### Phase 2 — Page Analysis & Content Modeling
- [ ] Identify section boundaries and content sequences for the homepage
- [ ] Decide default-content vs block for each sequence (authoring analysis)
- [ ] Inventory available blocks vs what the page needs; name any new block variants
- [ ] Map DOM selectors to block variants (block-mapping) in page-templates.json

### Phase 3 — Block Generation & Design
- [ ] Generate/extend any missing block variants and keep `component-definition.json` / `component-models.json` / `component-filters.json` in sync
- [ ] Migrate site design tokens (colors, typography, spacing) to match tataaia.com
- [ ] Style each block variant to match the source; visually verify in preview

### Phase 4 — Import Infrastructure & Content Import
- [ ] Generate import parsers and page transformers for the homepage blocks
- [ ] Build/bundle the project import script (use bundled importer + run-bulk-import.js — no hand-written HTML)
- [ ] Run the import to produce structured content HTML for the homepage
- [ ] Preview the imported page locally and verify block rendering + structure

### Phase 5 — Header / Navigation & Footer
- [ ] Instrument header/navigation (desktop, mobile, mega-menu as applicable) from source screenshots
- [ ] Reconcile and finish footer instrumentation (build on existing `footer.xml` / `footer.plain.html`)
- [ ] Verify nav and footer behavior/appearance against the original

### Phase 6 — X-Walk (JCR) Conversion & Upload
- [ ] Convert imported HTML content to **JCR XML** (validate Universal Editor block models & field hinting)
- [ ] Validate the page against the component models / template schema
- [ ] Upload page + assets to AEM Author under `/content/tata-aia` (assets to `/content/dam/tata-aia`)
- [ ] Preview the authored page and confirm parity with the source

### Phase 7 — Validation & Sign-off
- [ ] Run post-import validation (content completeness: source vs output)
- [ ] Visual critique of full page vs original; fix flagged issues and iterate
- [ ] Summarize migrated page, new blocks, and any follow-ups

## Notes / Constraints
- Do **not** hand-write or hand-edit HTML in the content directory — content is produced only via the bundled import script.
- Any new/changed block requires the three component JSON files to stay consistent for Universal Editor.
- Credentials for git / admin.hlx.page / Document Authoring uploads are injected automatically; if an upload returns 401/403, the corresponding Settings opt-in needs enabling (never paste tokens in chat).

---
**This plan is ready for review. Execution requires switching to Execute mode** — approve the plan and I'll begin with Phase 1 (project confirmation + homepage scrape).
