/* eslint-disable */
/* global WebImporter */

/**
 * Parser for columns-panels variant. Base: columns.
 * Source: Tata AIA homepage — .term-insurance-maininfo-container
 * Columns block: NO field hints (per hinting rules, Columns blocks use default content only).
 * Structure (from library): first content row holds N cells (one per column).
 * The source has a heading text block and an intro/body text block, rendered as 2 columns.
 */
export default function parse(element, { document }) {
  // Gather the distinct text sub-blocks in source order
  const textBlocks = Array.from(element.querySelectorAll('.cmp-text'));

  const columnCells = [];
  textBlocks.forEach((tb) => {
    if (!tb.textContent.trim()) return;
    const cell = document.createElement('div');
    // Move meaningful children (headings/paragraphs) into the cell
    Array.from(tb.children).forEach((child) => {
      if (child.textContent.trim() || child.querySelector('img')) {
        cell.appendChild(child.cloneNode(true));
      }
    });
    if (cell.childNodes.length) columnCells.push(cell);
  });

  // Fallback: if nothing collected, use the element's own text content
  if (!columnCells.length) {
    const cell = document.createElement('div');
    const p = document.createElement('p');
    p.textContent = element.textContent.trim();
    cell.appendChild(p);
    columnCells.push(cell);
  }

  // Single content row with one cell per column (no field hints for columns blocks)
  const cells = [columnCells];

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-panels', cells });
  element.replaceWith(block);
}
