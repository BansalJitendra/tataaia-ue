/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-persona variant. Base: cards.
 * Source: Tata AIA homepage — .term-plan-cards
 * Model: container with cards-persona-card items.
 *   Item fields: image (reference), imageAlt (collapsed), text (richtext)
 * Each card is a .proxyteaserv2 teaser with an image and a heading that wraps a link.
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

  let cards = Array.from(element.querySelectorAll('.proxyteaserv2'));
  if (!cards.length) cards = Array.from(element.querySelectorAll('.cmp-teaser'));
  const cells = [];

  cards.forEach((card) => {
    const img = normalizeImg(card.querySelector('.cmp-teaser__image img, img'));
    const heading = card.querySelector('.cmp-teaser__description h3, .cmp-teaser__title, h3, h4');
    const anchor = heading ? heading.querySelector('a') : null;
    const href = anchor ? anchor.getAttribute('href') : null;

    // Column 1: image field
    const imageFrag = document.createDocumentFragment();
    if (img) {
      imageFrag.appendChild(document.createComment(' field:image '));
      imageFrag.appendChild(img);
    }

    // Column 2: text field — heading (linked if anchor present)
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

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-persona', cells });
  element.replaceWith(block);
}
