/* eslint-disable */
/* global WebImporter */

/**
 * Parser for accordion-list variant. Base: accordion.
 * Source: Tata AIA homepage — .custom-accordion / .faq-accordian
 * Model: container with accordion-list-item children (2 columns per row).
 *   Item fields: summary (text) in cell 1, text (richtext) in cell 2.
 * Three source structures are supported:
 *   (a) .custom-accordion — flat `.accordion-content` where each question is an
 *       <h2> wrapping a span.faqHeading, followed by its answer content.
 *   (b) .faq-accordian (redesign) — a <ul> of `li.ta-fq-content-li`, each with the
 *       question in `.ta-fq-content-qtext` and the answer in `.ta-fq-ans-w`.
 *   (c) .custom-accordion with `.accordion-item` children — the clickable title is
 *       an <h2 class="custom-accordion-header"> (OUTSIDE .accordion-content) and the
 *       body is the sibling `.accordion-content` (e.g. the "Disclaimers" accordion).
 */
export default function parse(element, { document }) {
  const items = [];

  // Variant (b): redesign FAQ accordion — explicit li.ta-fq-content-li items.
  const fqItems = Array.from(element.querySelectorAll('li.ta-fq-content-li'));
  // Variant (c): .accordion-item with a .custom-accordion-header title.
  const headerItems = Array.from(element.querySelectorAll('.accordion-item'))
    .filter((it) => it.querySelector('.custom-accordion-header'));

  if (fqItems.length) {
    fqItems.forEach((li) => {
      const qEl = li.querySelector('.ta-fq-content-qtext');
      const ansEl = li.querySelector('.ta-fq-ans-w');
      const summary = qEl ? qEl.textContent.trim() : '';
      const content = [];
      if (ansEl) {
        // Prefer the inner answer body, else the whole answer wrapper's children.
        const body = ansEl.querySelector('.ta-fq-ans-m') || ansEl;
        Array.from(body.children).forEach((node) => {
          if (node.textContent.trim() || node.querySelector('img')) content.push(node);
        });
      }
      if (summary || content.length) items.push({ summary, content });
    });
  } else if (headerItems.length && !element.querySelector('.accordion-content .faqHeading')) {
    // Variant (c): title in .custom-accordion-header, body in .accordion-content.
    headerItems.forEach((item) => {
      const header = item.querySelector('.custom-accordion-header');
      const body = item.querySelector('.accordion-content');
      const summary = header ? header.textContent.trim() : '';
      const content = [];
      if (body) {
        Array.from(body.children).forEach((node) => {
          if (node.textContent.trim() || node.querySelector('img')) content.push(node);
        });
      }
      if (summary || content.length) items.push({ summary, content });
    });
  } else {
    // Variant (a): flat .accordion-content grouped by .faqHeading.
    const container = element.querySelector('.accordion-content') || element;
    const nodes = Array.from(container.children);
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
  }

  // Any <table> nested in an answer is hoisted out here: EDS block cells serialize
  // through markdown, which cannot represent a table inside another block's cell
  // (it flattens to <p>Yes</p><p>No</p>). Collected tables are emitted as standalone
  // table-data blocks right after the accordion — where they sit in the source.
  // The accordion block itself keeps its 2-column (summary + text) row structure.
  const hoistedTables = [];
  // Images inside answers are likewise hoisted out (md2jcr's greedy richtext stops
  // at an image mid-answer, breaking the item). They are re-emitted as plain
  // default-content <picture> right after the accordion so they still render in the
  // section (e.g. the Disclaimers fund-performance charts) without destabilising the
  // uniform summary+text rows.
  const hoistedImages = [];

  const cells = [];
  items.forEach((item) => {
    if (!item.summary && !item.content.length) return;

    // Column 1: summary field (question) — the clickable title
    const summaryFrag = document.createDocumentFragment();
    if (item.summary) {
      summaryFrag.appendChild(document.createComment(' field:summary '));
      summaryFrag.appendChild(document.createTextNode(item.summary));
    }

    // Column 2: text field (answer richtext). Two things are stripped so the
    // single richtext field maps cleanly in JCR:
    //   - tables → hoisted out into standalone table-data blocks (below); a table
    //     cannot be nested inside another block's markdown cell.
    //   - inline images/pictures → removed. The accordion item model has only
    //     summary + text (no image field), and md2jcr's greedy richtext stops at
    //     an image mid-answer, orphaning the following nodes and failing the
    //     conversion (this is what forced the Disclaimers answer to degrade to
    //     plain text). Dropping the images keeps the accordion + all its text.
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
      }
      // Pull inline images/pictures out of the answer richtext and hoist them.
      if (clone.tagName === 'IMG' || clone.tagName === 'PICTURE') {
        hoistedImages.push(clone.tagName === 'PICTURE' ? clone : (() => {
          const p = document.createElement('picture');
          p.appendChild(clone);
          return p;
        })());
        return;
      }
      if (clone.querySelectorAll) {
        clone.querySelectorAll('picture, img').forEach((im) => {
          const pic = im.closest('picture') || im;
          const out = pic.tagName === 'PICTURE' ? pic.cloneNode(true) : (() => {
            const p = document.createElement('picture');
            p.appendChild(pic.cloneNode(true));
            return p;
          })();
          hoistedImages.push(out);
          if (pic.parentNode) pic.parentNode.removeChild(pic);
        });
      }
      // Keep the (table/image-stripped) node only if it still carries text.
      if (clone.textContent.trim()) textFrag.appendChild(clone);
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

  // Emit hoisted answer images as plain default-content <picture> right after the
  // accordion (and after any hoisted tables), so they render within the section.
  if (hoistedImages.length) {
    const wrapper = document.createElement('div');
    hoistedImages.forEach((pic) => {
      const p = document.createElement('p');
      p.appendChild(pic);
      wrapper.appendChild(p);
    });
    // place after the accordion block (and its hoisted tables)
    let anchor = block;
    while (anchor.nextElementSibling
      && anchor.nextElementSibling.classList
      && anchor.nextElementSibling.classList.contains('table-data')) {
      anchor = anchor.nextElementSibling;
    }
    anchor.after(...wrapper.childNodes);
  }
}
