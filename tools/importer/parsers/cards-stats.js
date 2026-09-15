/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-stats variant. Base: cards.
 * Source: Tata AIA homepage — .whychoose-cards
 * Model: container with cards-stats-card items.
 *   Item fields: image (reference), imageAlt (collapsed), text (richtext)
 * Each card is a .proxyteaserv2 teaser: icon image + h3 stat + description paragraph.
 */
export default function parse(element, { document }) {
  function normalizeImg(img) {
    if (!img) return null;
    const src = img.getAttribute('src') || img.getAttribute('data-src') || img.getAttribute('data-cmp-filereference');
    if (!src) return null;
    const out = document.createElement('img');
    out.setAttribute('src', src);
    const alt = img.getAttribute('alt');
    if (alt) out.setAttribute('alt', alt);
    return out;
  }

  // Detect a leading section heading (h1–h4) that is NOT part of a repeating
  // card item, so it can be emitted as section-level default content.
  function extractSectionHeading(itemSelector) {
    const headings = Array.from(element.querySelectorAll('h1, h2, h3, h4'));
    for (const h of headings) {
      if (itemSelector && h.closest(itemSelector)) continue;
      const text = h.textContent.trim();
      if (text) {
        const out = document.createElement(h.tagName.toLowerCase());
        out.textContent = text;
        return out;
      }
    }
    return null;
  }

  const sectionHeading = extractSectionHeading('.proxyteaserv2, .cmp-teaser');
  let cards = Array.from(element.querySelectorAll('.proxyteaserv2'));
  if (!cards.length) cards = Array.from(element.querySelectorAll('.cmp-teaser'));
  const cells = [];

  cards.forEach((card) => {
    const img = normalizeImg(card.querySelector('.cmp-teaser__image img, img'));
    const desc = card.querySelector('.cmp-teaser__description');
    const heading = desc ? desc.querySelector('h3, h4, h2') : null;
    const paras = desc ? Array.from(desc.querySelectorAll('p')) : [];

    // Column 1: image field
    const imageFrag = document.createDocumentFragment();
    if (img) {
      imageFrag.appendChild(document.createComment(' field:image '));
      imageFrag.appendChild(img);
    }

    // Column 2: text field — stat heading + description
    const textFrag = document.createDocumentFragment();
    textFrag.appendChild(document.createComment(' field:text '));
    if (heading && heading.textContent.trim()) {
      const h = document.createElement('h3');
      h.textContent = heading.textContent.trim();
      textFrag.appendChild(h);
    }
    paras.forEach((p) => {
      if (p.textContent.trim()) {
        const np = document.createElement('p');
        np.innerHTML = p.innerHTML;
        textFrag.appendChild(np);
      }
    });

    if (img || heading || paras.length) cells.push([imageFrag, textFrag]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-stats', cells });
  // Emit the section heading as default content BEFORE the block table so it
  // survives into the output as section-level content (not inside a card cell).
  if (sectionHeading) {
    element.replaceWith(sectionHeading, block);
  } else {
    element.replaceWith(block);
  }
}
