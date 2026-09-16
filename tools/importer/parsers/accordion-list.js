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

  // Any <table> nested in an answer is hoisted out here: EDS block cells serialize
  // through markdown, which cannot represent a table inside another block's cell
  // (it flattens to <p>Yes</p><p>No</p>). Collected tables are emitted as standalone
  // table-data blocks right after the accordion — where they sit in the source.
  // The accordion block itself keeps its 2-column (summary + text) row structure.
  const hoistedTables = [];

  const cells = [];
  items.forEach((item) => {
    if (!item.summary && !item.content.length) return;

    // Column 1: summary field (question) — the clickable title
    const summaryFrag = document.createDocumentFragment();
    if (item.summary) {
      summaryFrag.appendChild(document.createComment(' field:summary '));
      summaryFrag.appendChild(document.createTextNode(item.summary));
    }

    // Column 2: text field (answer richtext) — strip any tables into hoistedTables
    const textFrag = document.createDocumentFragment();
    textFrag.appendChild(document.createComment(' field:text '));
    item.content.forEach((node) => {
      const clone = node.cloneNode(true);
      if (clone.tagName === 'TABLE') {
        hoistedTables.push(clone);
        return;
      }
      const nested = clone.querySelectorAll ? Array.from(clone.querySelectorAll('table')) : [];
      if (nested.length) {
        nested.forEach((t) => { hoistedTables.push(t.cloneNode(true)); t.remove(); });
        // Keep the table-stripped remainder only if it still carries content.
        if (clone.textContent.trim() || (clone.querySelector && clone.querySelector('img'))) {
          textFrag.appendChild(clone);
        }
      } else {
        textFrag.appendChild(clone);
      }
    });

    cells.push([summaryFrag, textFrag]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'accordion-list', cells });
  element.replaceWith(block);

  // Emit each hoisted table as a standalone table-data block after the accordion.
  const fieldNames = ['column1text', 'column2text', 'column3text'];
  hoistedTables.forEach((table) => {
    const rows = Array.from(table.querySelectorAll('tr'));
    const tableCells = [];
    rows.forEach((tr) => {
      const tds = Array.from(tr.querySelectorAll(':scope > td, :scope > th'));
      if (!tds.length) return;
      const rowCells = [];
      for (let i = 0; i < 3; i += 1) {
        const frag = document.createDocumentFragment();
        const td = tds[i];
        if (td && td.textContent.trim()) {
          frag.appendChild(document.createComment(` field:${fieldNames[i]} `));
          Array.from(td.childNodes).forEach((n) => frag.appendChild(n.cloneNode(true)));
        }
        rowCells.push(frag);
      }
      tableCells.push(rowCells);
    });
    if (tableCells.length) {
      const tableBlock = WebImporter.Blocks.createBlock(document, { name: 'table-data', cells: tableCells });
      block.after(tableBlock);
    }
  });
}
