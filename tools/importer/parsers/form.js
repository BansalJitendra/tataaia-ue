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
export default function parse(element, { document }) {
  const formEl = element.querySelector('form');

  // reference: a link to a form definition JSON, if one is present in the source
  let referenceHref = null;
  const jsonLink = element.querySelector('a[href$=".json"]');
  if (jsonLink) referenceHref = jsonLink.getAttribute('href');

  // action: an explicit submit endpoint, if declared on the form element
  let actionUrl = null;
  if (formEl) {
    actionUrl = formEl.getAttribute('action')
      || formEl.getAttribute('data-action')
      || formEl.getAttribute('data-url')
      || null;
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

  // Row: action field (submit/Action URL)
  const actionFrag = document.createDocumentFragment();
  if (actionUrl) {
    actionFrag.appendChild(document.createComment(' field:action '));
    actionFrag.appendChild(document.createTextNode(actionUrl));
  }
  cells.push([actionFrag]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'form', cells });
  element.replaceWith(block);
}
