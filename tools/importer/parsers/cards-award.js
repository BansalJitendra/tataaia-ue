/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-award variant. Base: cards.
 * Source: Tata AIA homepage — .award-section
 * Model: container with cards-award-card items.
 *   Item fields: image (reference), imageAlt (collapsed), text (richtext)
 * Each card is a .leadproxyv2teaser teaser (swiper slide): image + description paragraphs.
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

  let cards = Array.from(element.querySelectorAll('.leadproxyv2teaser'));
  if (!cards.length) cards = Array.from(element.querySelectorAll('.cmp-teaser'));
  const cells = [];

  cards.forEach((card) => {
    const img = normalizeImg(card.querySelector('.cmp-teaser__image img, img'));
    const desc = card.querySelector('.cmp-teaser__description');
    const paras = desc ? Array.from(desc.querySelectorAll('p')) : [];

    // Column 1: image field
    const imageFrag = document.createDocumentFragment();
    if (img) {
      imageFrag.appendChild(document.createComment(' field:image '));
      imageFrag.appendChild(img);
    }

    // Column 2: text field — award name / details paragraphs
    const textFrag = document.createDocumentFragment();
    textFrag.appendChild(document.createComment(' field:text '));
    if (paras.length) {
      paras.forEach((p) => {
        if (p.textContent.trim()) {
          const np = document.createElement('p');
          np.textContent = p.textContent.trim();
          textFrag.appendChild(np);
        }
      });
    } else if (desc && desc.textContent.trim()) {
      const np = document.createElement('p');
      np.textContent = desc.textContent.trim();
      textFrag.appendChild(np);
    }

    if (img || paras.length) cells.push([imageFrag, textFrag]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-award', cells });
  element.replaceWith(block);
}
