/* eslint-disable */
/* global WebImporter */

/**
 * Parser for accordion-list variant. Base: accordion.
 * Source: Tata AIA homepage — .custom-accordion / .faq-accordian
 * Model: container with accordion-list-item children (2 columns per row).
 *   Item fields: summary (text) in cell 1, text (richtext) in cell 2.
 * The source is a FAQ region where each question is an <h2> wrapping a span.faqHeading,
 * followed by its answer content until the next question heading.
 */
export default function parse(element, { document }) {
  const container = element.querySelector('.accordion-content') || element;
  const nodes = Array.from(container.children);

  // Group nodes into FAQ items: a new item starts at each heading containing .faqHeading
  const items = [];
  let current = null;
  nodes.forEach((node) => {
    const headingSpan = node.matches && /^H[1-6]$/.test(node.tagName) ? node.querySelector('.faqHeading') : null;
    if (headingSpan) {
      current = { summary: headingSpan.textContent.trim(), content: [] };
      items.push(current);
    } else if (current) {
      if (node.textContent.trim() || node.querySelector('img')) current.content.push(node);
    }
  });

  const cells = [];
  items.forEach((item) => {
    if (!item.summary && !item.content.length) return;

    // Column 1: summary field (question)
    const summaryFrag = document.createDocumentFragment();
    if (item.summary) {
      summaryFrag.appendChild(document.createComment(' field:summary '));
      summaryFrag.appendChild(document.createTextNode(item.summary));
    }

    // Column 2: text field (answer richtext)
    const textFrag = document.createDocumentFragment();
    textFrag.appendChild(document.createComment(' field:text '));
    item.content.forEach((node) => textFrag.appendChild(node.cloneNode(true)));

    cells.push([summaryFrag, textFrag]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'accordion-list', cells });
  element.replaceWith(block);
}
