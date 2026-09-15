/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-promo variant. Base: cards.
 * Source: Tata AIA homepage — .quiz-test-cards
 * Model: container with cards-promo-card items.
 *   Item fields: image (reference), imageAlt (collapsed), text (richtext)
 * Each card is a .proxyteaserv2 teaser: image + heading + a paragraph containing the CTA link.
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
    const heading = desc ? desc.querySelector('h3, h4, h2') : card.querySelector('h3, h4, h2');
    // CTA anchor within a paragraph
    const ctaAnchor = desc ? desc.querySelector('p a[href]') : null;

    // Column 1: image field
    const imageFrag = document.createDocumentFragment();
    if (img) {
      imageFrag.appendChild(document.createComment(' field:image '));
      imageFrag.appendChild(img);
    }

    // Column 2: text field — heading + CTA link
    const textFrag = document.createDocumentFragment();
    textFrag.appendChild(document.createComment(' field:text '));
    if (heading) {
      const h = document.createElement('h3');
      h.innerHTML = heading.innerHTML;
      textFrag.appendChild(h);
    }
    if (ctaAnchor) {
      const href = ctaAnchor.getAttribute('href');
      const p = document.createElement('p');
      const a = document.createElement('a');
      a.setAttribute('href', href);
      a.textContent = ctaAnchor.textContent.trim();
      p.appendChild(a);
      textFrag.appendChild(p);
    }

    if (img || heading) cells.push([imageFrag, textFrag]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-promo', cells });
  // Emit the section heading as default content BEFORE the block table so it
  // survives into the output as section-level content (not inside a card cell).
  if (sectionHeading) {
    element.replaceWith(sectionHeading, block);
  } else {
    element.replaceWith(block);
  }
}
