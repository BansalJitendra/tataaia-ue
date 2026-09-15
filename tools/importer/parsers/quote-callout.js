/* eslint-disable */
/* global WebImporter */

/**
 * Parser for quote-callout variant. Base: quote (custom — no library convention).
 * Source: Tata AIA homepage — .quote-benefit-Illustration
 * Model: simple block, fields: quotation (richtext), attribution (richtext).
 *   Rows: one cell per field, each preceded by its field hint.
 * The source is a promotional CTA button ("Quote/Benefit Illustration") linking to the
 * quote-generation tool; the button label is the quotation and its link is preserved.
 */
export default function parse(element, { document }) {
  const anchor = element.querySelector('a[href]');
  const labelEl = element.querySelector('.cmp-button__text, .cmp-button span');
  const label = labelEl ? labelEl.textContent.trim() : (anchor ? anchor.textContent.trim() : element.textContent.trim());
  const href = anchor ? anchor.getAttribute('href') : null;

  if (!label && !href) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  // Row: quotation field — the callout label as a linked call-to-action
  const quotationFrag = document.createDocumentFragment();
  quotationFrag.appendChild(document.createComment(' field:quotation '));
  const p = document.createElement('p');
  if (href) {
    const a = document.createElement('a');
    a.setAttribute('href', href);
    a.textContent = label || 'Quote/Benefit Illustration';
    p.appendChild(a);
  } else {
    p.textContent = label;
  }
  quotationFrag.appendChild(p);
  cells.push([quotationFrag]);

  // Row: attribution field — left empty (no attribution in source); hint omitted for empty cell
  const attributionFrag = document.createDocumentFragment();
  cells.push([attributionFrag]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'quote-callout', cells });
  element.replaceWith(block);
}
