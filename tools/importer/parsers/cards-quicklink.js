/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-quicklink variant. Base: cards.
 * Source: Tata AIA homepage — .quick-access-cards
 * Model: container with cards-quicklink-card items.
 *   Item fields: image (reference), imageAlt (collapsed), text (richtext)
 * Each card is a .teaserv2 teaser whose whole card is wrapped in an <a.cmp-teaser__link>;
 * the card has an icon image and an h3 label.
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

  let cards = Array.from(element.querySelectorAll('.teaserv2'));
  if (!cards.length) cards = Array.from(element.querySelectorAll('.cmp-teaser'));
  const cells = [];

  cards.forEach((card) => {
    const img = normalizeImg(card.querySelector('.cmp-teaser__image img, img'));
    const heading = card.querySelector('.cmp-teaser__description h3, h3, h4');
    const linkEl = card.querySelector('a.cmp-teaser__link, a[href]');
    const href = linkEl ? linkEl.getAttribute('href') : null;

    // Column 1: image field
    const imageFrag = document.createDocumentFragment();
    if (img) {
      imageFrag.appendChild(document.createComment(' field:image '));
      imageFrag.appendChild(img);
    }

    // Column 2: text field — heading as a link (whole card is clickable)
    const textFrag = document.createDocumentFragment();
    textFrag.appendChild(document.createComment(' field:text '));
    if (heading) {
      const h = document.createElement('h3');
      const text = heading.textContent.trim();
      if (href) {
        const a = document.createElement('a');
        a.setAttribute('href', href);
        a.textContent = text;
        h.appendChild(a);
      } else {
        h.textContent = text;
      }
      textFrag.appendChild(h);
    }

    if (img || heading) cells.push([imageFrag, textFrag]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-quicklink', cells });
  element.replaceWith(block);
}
