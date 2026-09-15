/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-article variant. Base: cards.
 * Source: Tata AIA homepage — .homepage-revamp-blog-cards
 * Model: container with cards-article-card items.
 *   Item fields: image (reference), imageAlt (collapsed), text (richtext)
 * Each blog card is a .things-card-layout containing an <a> that wraps the image,
 * a category tag (.things-card-tag) and a title (.blog-car-static-anly-linkpos).
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

  const cards = Array.from(element.querySelectorAll('.things-card-layout'));
  const cells = [];

  cards.forEach((card) => {
    const img = normalizeImg(card.querySelector('.picture-wrapper img, img'));
    const tag = card.querySelector('.things-card-tag');
    const titleEl = card.querySelector('.blog-car-static-anly-linkpos');
    const linkEl = card.querySelector('a[href]');
    const href = linkEl ? linkEl.getAttribute('href') : null;

    // Column 1: image field
    const imageFrag = document.createDocumentFragment();
    if (img) {
      imageFrag.appendChild(document.createComment(' field:image '));
      imageFrag.appendChild(img);
    }

    // Column 2: text field — tag + linked title heading
    const textFrag = document.createDocumentFragment();
    textFrag.appendChild(document.createComment(' field:text '));
    if (tag && tag.textContent.trim()) {
      const p = document.createElement('p');
      p.textContent = tag.textContent.trim();
      textFrag.appendChild(p);
    }
    if (titleEl && titleEl.textContent.trim()) {
      const h = document.createElement('h3');
      const text = titleEl.textContent.trim();
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

    if (img || titleEl) cells.push([imageFrag, textFrag]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-article', cells });
  element.replaceWith(block);
}
