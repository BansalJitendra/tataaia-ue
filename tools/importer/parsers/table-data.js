/* eslint-disable */
/* global WebImporter */

/**
 * Parser for table-data variant. Base: table.
 * Source: Tata AIA homepage — <table> (Feature / Online / Offline comparison).
 * Model: container with table-data-row items.
 *   Row item fields (each its own column): column1text, column2text, column3text (richtext).
 * Each source <tr> becomes one block row with 3 field-hinted cells.
 */
export default function parse(element, { document }) {
  const table = element.matches('table') ? element : element.querySelector('table');
  const rows = table ? Array.from(table.querySelectorAll('tr')) : [];

  const cells = [];
  const fieldNames = ['column1text', 'column2text', 'column3text'];

  rows.forEach((tr) => {
    const tds = Array.from(tr.querySelectorAll(':scope > td, :scope > th'));
    if (!tds.length) return;

    const rowCells = [];
    for (let i = 0; i < 3; i += 1) {
      const frag = document.createDocumentFragment();
      const td = tds[i];
      if (td && td.textContent.trim()) {
        frag.appendChild(document.createComment(` field:${fieldNames[i]} `));
        // Preserve inner richtext (bold labels, paragraphs)
        Array.from(td.childNodes).forEach((n) => frag.appendChild(n.cloneNode(true)));
      }
      rowCells.push(frag);
    }
    cells.push(rowCells);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'table-data', cells });
  element.replaceWith(block);
}
