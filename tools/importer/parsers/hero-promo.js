/* eslint-disable */
/* global WebImporter */

/**
 * Parser for hero-promo variant. Base: hero.
 * Source: Tata AIA homepage — .homepage-banner-slider-container
 * Model: simple block, fields: image (reference), imageAlt (collapsed), text (richtext)
 * Structure: 1 column — background image row (field:image) + text row (field:text).
 * The source is a swiper carousel of banner slides; hero-promo is a simple (non-container)
 * block, so the first slide is used as the representative hero.
 */
export default function parse(element, { document }) {
  // Use the first banner slide as the representative hero
  const slide = element.querySelector('.swiper-slide') || element;

  // Background image from the slide's <picture> (desktop source preferred)
  let bgImage = null;
  const sources = Array.from(slide.querySelectorAll('picture source[srcset], picture source[data-srcset]'));
  let chosen = sources.find((s) => /min-width/i.test(s.getAttribute('media') || '')) || sources[0];
  if (chosen) {
    const srcset = chosen.getAttribute('srcset') || chosen.getAttribute('data-srcset');
    if (srcset) {
      bgImage = document.createElement('img');
      bgImage.setAttribute('src', srcset.split(',')[0].trim().split(' ')[0]);
      const pic = chosen.closest('picture');
      const pImg = pic ? pic.querySelector('img') : null;
      const alt = pImg ? pImg.getAttribute('alt') : null;
      if (alt) bgImage.setAttribute('alt', alt);
    }
  }
  if (!bgImage) {
    const img = slide.querySelector('img[src]:not([src=""]), img[data-src]');
    if (img) {
      const src = img.getAttribute('src') || img.getAttribute('data-src');
      if (src) {
        bgImage = document.createElement('img');
        bgImage.setAttribute('src', src);
        const alt = img.getAttribute('alt');
        if (alt) bgImage.setAttribute('alt', alt);
      }
    }
  }

  // Text content: all banner text paragraphs + CTA
  const textBlocks = Array.from(slide.querySelectorAll('.cmp-text p, .banner-pretitle p, .pretitle-title p, .banner-pointers p'))
    .filter((p) => p.textContent.trim());
  const cta = slide.querySelector('a.cmp-button, a[href], .cmp-button');

  const cells = [];

  // Row 2: background image (field:image)
  const imageFrag = document.createDocumentFragment();
  if (bgImage) {
    imageFrag.appendChild(document.createComment(' field:image '));
    imageFrag.appendChild(bgImage);
  }
  cells.push([imageFrag]);

  // Row 3: text content (field:text)
  const textFrag = document.createDocumentFragment();
  textFrag.appendChild(document.createComment(' field:text '));
  const seen = new Set();
  textBlocks.forEach((p) => {
    const txt = p.textContent.trim();
    if (seen.has(txt)) return;
    seen.add(txt);
    const np = document.createElement('p');
    np.innerHTML = p.innerHTML;
    textFrag.appendChild(np);
  });
  if (cta && cta.getAttribute && cta.getAttribute('href')) {
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.setAttribute('href', cta.getAttribute('href'));
    a.textContent = (cta.textContent || '').trim() || 'Know more';
    p.appendChild(a);
    textFrag.appendChild(p);
  }
  cells.push([textFrag]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-promo', cells });
  element.replaceWith(block);
}
