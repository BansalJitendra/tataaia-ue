# JCR compatibility rules (x-walk / crosswalk)

This is a **crosswalk** project: content is authored in AEM and stored as JCR.
"Renders in the local preview" does **not** mean "converts to JCR." The
`helix-md2jcr` converter maps every block's cells onto its Universal Editor
model **strictly**, and the "Create content package" UI only shows pages whose
JCR converted. After ANY content/block/parser change, regenerate and validate:

```bash
node tools/importer/generate-jcr.mjs     # HTML -> per-section JCR -> migration-work/jcr-content/index.xml
node tools/importer/validate-jcr.mjs     # fast offline compatibility checks (exit 1 on problems)
```

Do not consider a content change "done" until `validate-jcr.mjs` prints PASS.

## Rules learned (each caused a real failure this project)

1. **Container blocks must not carry both a `model` and a `filter`.**
   A repeating block (rows/items) uses `filter="<block>"` + an item model
   (`<block>-item` / `<block>-row`) and **no container `model`** (see
   accordion-list). If the container also declares a `model`, md2jcr tries to
   map the data rows onto the container model's fields and overflows
   ("… every field must align with a column"). Fixed table-data this way.

2. **`reference` image fields take a bare image, never a linked image.**
   `[![alt](link)]` (link wrapping an image) overflows a `reference` field.
   Put the plain `<picture>`/image in the image cell; model the link separately
   or drop it. Model repeating image blocks on the proven carousel-review shape
   (`media_image` + `media_imageAlt` [+ `content_text`]). Fixed carousel-banner.

3. **Field names collapse on the `_` prefix.** Fields sharing a prefix
   (`media_image`, `media_imageAlt`) group together; distinct prefixes become
   separate cells. Match the cell layout the parser emits.

4. **Every block/item model referenced must exist** in `component-models.json`,
   and every block/item **name must exactly match** a `component-definition.json`
   title (case-sensitive). Run `npm run build:json` after editing any
   `blocks/*/_*.json` so the merged component JSONs stay in sync.

5. **Escape ampersands in link attributes.** md2jcr can emit raw `&` inside
   `link="…?a=1&b=2"` (e.g. the SRP button URL), which is invalid XML. The
   generator escapes these; `validate-jcr.mjs` fails if any remain.

6. **Field hints must match model fields.** Parser cells use
   `<!-- field:name -->`; `name` must be a real field on that item's model, or
   the cell content won't map.

7. **Only visible content belongs in the import.** Hidden popups/loaders/
   chatbots/keyboards leak in as default content and both bloat the page and
   destabilise conversion — strip them in `transformers/tataaia-cleanup.js`.

8. **Whole-page conversion is order-sensitive.** Even when every block converts
   individually, the full page can trip a cumulative bug in md2jcr. That is why
   `generate-jcr.mjs` converts **each EDS section in its own subprocess** and
   stitches the `<section>` nodes together. Keep using it — do not switch back
   to a single whole-page `md2jcr` call.

## Workflow for a content change
1. Edit parser/transformer/block as usual; keep `_<block>.json` + `npm run build:json` in sync.
2. Re-run the import (`run-bulk-import.js … --force`) to refresh `content/index.plain.html`.
3. `node tools/importer/generate-jcr.mjs` to regenerate `migration-work/jcr-content/`.
4. `node tools/importer/validate-jcr.mjs` — must print PASS before upload/packaging.
