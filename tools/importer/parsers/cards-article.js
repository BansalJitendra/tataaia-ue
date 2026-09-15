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

  const sectionHeading = extractSectionHeading('.things-card-layout');
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
  // Emit the section heading as default content BEFORE the block table so it
  // survives into the output as section-level content (not inside a card cell).
  if (sectionHeading) {
    element.replaceWith(sectionHeading, block);
  } else {
    element.replaceWith(block);
  }
}
