/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-plan variant. Base: cards.
 * Source: Tata AIA homepage — .bannerSectionCategoryCards
 * Model: container with cards-plan-card items.
 *   Item fields: image (reference), imageAlt (collapsed), text (richtext)
 * Each card is an <a.gradient-wrapper> linked plan card with an icon and title/subtitle.
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

  const cards = Array.from(element.querySelectorAll('a.gradient-wrapper'));
  const cells = [];

  cards.forEach((card) => {
    const href = card.getAttribute('href');
    const img = normalizeImg(card.querySelector('.bannerCategoryImg img, img'));
    const heading = card.querySelector('.bannerCategoryText h3, h3');
    const tag = card.querySelector('.bannerCategoryCardTags');
    const desc = card.querySelector('.bannerCategoryText p');

    // Column 1: image field
    const imageFrag = document.createDocumentFragment();
    if (img) {
      imageFrag.appendChild(document.createComment(' field:image '));
      imageFrag.appendChild(img);
    }

    // Column 2: text field (tag + linked heading + description)
    const textFrag = document.createDocumentFragment();
    textFrag.appendChild(document.createComment(' field:text '));
    if (tag && tag.textContent.trim()) {
      const p = document.createElement('p');
      p.textContent = tag.textContent.trim();
      textFrag.appendChild(p);
    }
    if (heading) {
      const h = document.createElement('h3');
      if (href) {
        const a = document.createElement('a');
        a.setAttribute('href', href);
        a.textContent = heading.textContent.trim();
        h.appendChild(a);
      } else {
        h.textContent = heading.textContent.trim();
      }
      textFrag.appendChild(h);
    }
    if (desc && desc.textContent.trim()) {
      const p = document.createElement('p');
      p.innerHTML = desc.innerHTML;
      textFrag.appendChild(p);
    }

    cells.push([imageFrag, textFrag]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-plan', cells });
  element.replaceWith(block);
}
