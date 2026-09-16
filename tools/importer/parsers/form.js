/* eslint-disable */
/* global WebImporter */

/**
 * Parser for form variant. Base: form (Adaptive Form / forms plugin — no library convention).
 * Source: Tata AIA homepage — .tte-form-redesign / .new-homepage-calc-container
 * Model: simple block, fields:
 *   reference (aem-content) — link to the form definition (.json). One row.
 *   action (text) — submit/Action URL. One row.
 * The source is a bespoke AEM lead form (id="tte-review-form") with no exportable
 * form-definition JSON and no explicit submit endpoint in the DOM. We emit the block with
 * field-hinted cells for any values we can resolve; empty cells carry no hint (per hinting rules)
 * so an author can wire the form reference in Universal Editor.
 */
// Known lead forms whose fields were migrated to an EDS Form JSON sheet
// (the source markup is a bespoke JS-driven form with no exportable definition).
// Keyed by a stable source container class → the JSON authored under content/.
const FORM_DEFINITIONS = {
  'new-homepage-calc-container': 'know-more-buy-2steps.json',
  'tte-form-redesign': 'looking-to-buy-callback.json',
};

// Submit endpoint per mapped form. The form block (aem-block-collection) requires a
// second link as the submit action; the source form is JS/OTP-driven with no plain
// endpoint, so we author a submit path the author can repoint in Universal Editor.
const FORM_ACTIONS = {
  'new-homepage-calc-container': '/forms/lead-submit',
};

export default function parse(element, { document }) {
  const formEl = element.querySelector('form');

  // reference: a link to a form definition JSON.
  let referenceHref = null;
  // 1) an explicit JSON link already present in the source, else
  const jsonLink = element.querySelector('a[href$=".json"]');
  if (jsonLink) referenceHref = jsonLink.getAttribute('href');
  // 2) a migrated EDS Form JSON mapped from the source container class.
  if (!referenceHref) {
    const mapped = Object.keys(FORM_DEFINITIONS)
      .find((cls) => element.classList.contains(cls) || element.closest(`.${cls}`));
    if (mapped) referenceHref = FORM_DEFINITIONS[mapped];
  }

  // action: an explicit submit endpoint, if declared on the form element,
  // else the authored submit path for a mapped lead form.
  let actionUrl = null;
  if (formEl) {
    actionUrl = formEl.getAttribute('action')
      || formEl.getAttribute('data-action')
      || formEl.getAttribute('data-url')
      || null;
  }
  if (!actionUrl && referenceHref) {
    const mapped = Object.keys(FORM_ACTIONS)
      .find((cls) => element.classList.contains(cls) || element.closest(`.${cls}`));
    if (mapped) actionUrl = FORM_ACTIONS[mapped];
  }

  const cells = [];

  // Row: reference field (aem-content link to the form model)
  const referenceFrag = document.createDocumentFragment();
  if (referenceHref) {
    referenceFrag.appendChild(document.createComment(' field:reference '));
    const a = document.createElement('a');
    a.setAttribute('href', referenceHref);
    a.textContent = referenceHref;
    referenceFrag.appendChild(a);
  }
  cells.push([referenceFrag]);

  // Row: action field — the form block reads the submit endpoint from a second
  // <a> link (not text), so emit it as an anchor when present.
  const actionFrag = document.createDocumentFragment();
  if (actionUrl) {
    actionFrag.appendChild(document.createComment(' field:action '));
    const a = document.createElement('a');
    a.setAttribute('href', actionUrl);
    a.textContent = actionUrl;
    actionFrag.appendChild(a);
  }
  cells.push([actionFrag]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'form', cells });
  element.replaceWith(block);
}
