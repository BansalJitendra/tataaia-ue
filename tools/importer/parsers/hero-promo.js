/* eslint-disable */
/* global WebImporter */

/**
 * Parser for hero-promo variant. Base: hero (carousel).
 * Source: Tata AIA homepage — .homepage-banner-slider-container (a swiper of
 * promo banner slides at the top of the page).
 * Model: CONTAINER block (filter: hero-promo) with repeating hero-promo-item rows.
 *   Item fields per row (two cells):
 *     - media_image (reference) + media_imageAlt (collapsed) — the slide background
 *     - content_text (richtext) — eyebrow, heading, chip <p>s, fine print, CTA
 * Every non-duplicate .swiper-slide becomes one row so the carousel keeps all
 * its slides (previously only the first slide was emitted).
 */
export default function parse(element, { document }) {
  // Collect the real (non-duplicate) slides; fall back to the element itself.
  let slides = Array.from(element.querySelectorAll('.swiper-slide'))
    .filter((s) => !s.classList.contains('swiper-slide-duplicate'));
  if (!slides.length) slides = [element];

  // De-dupe slides that share the same background image (swiper clones).
  const seenBg = new Set();

  const pickBgImage = (slide) => {
    // Prefer the desktop <source> of the slide's background <picture>.
    const sources = Array.from(slide.querySelectorAll('picture source[srcset], picture source[data-srcset]'));
    const chosen = sources.find((s) => /min-width/i.test(s.getAttribute('media') || '')) || sources[0];
    if (chosen) {
      const srcset = chosen.getAttribute('srcset') || chosen.getAttribute('data-srcset');
      if (srcset) {
        const img = document.createElement('img');
        img.setAttribute('src', srcset.split(',')[0].trim().split(' ')[0]);
        const pic = chosen.closest('picture');
        const pImg = pic ? pic.querySelector('img') : null;
        const alt = pImg ? pImg.getAttribute('alt') : null;
        if (alt) img.setAttribute('alt', alt);
        return img;
      }
    }
    const bare = slide.querySelector('img[src]:not([src=""]), img[data-src]');
    if (bare) {
      const src = bare.getAttribute('src') || bare.getAttribute('data-src');
      if (src) {
        const img = document.createElement('img');
        img.setAttribute('src', src);
        const alt = bare.getAttribute('alt');
        if (alt) img.setAttribute('alt', alt);
        return img;
      }
    }
    return null;
  };

  const cells = [];

  slides.forEach((slide) => {
    const bgImage = pickBgImage(slide);
    const bgKey = bgImage ? bgImage.getAttribute('src') : null;
    if (bgKey) {
      if (seenBg.has(bgKey)) return; // skip cloned slide
      seenBg.add(bgKey);
    }

    // Text content: banner text paragraphs + CTA, in source order, de-duped.
    const textBlocks = Array.from(slide.querySelectorAll('.cmp-text p, .banner-pretitle p, .pretitle-title p, .banner-pointers p'))
      .filter((p) => p.textContent.trim());
    const cta = slide.querySelector('a.cmp-button, .cmp-button a, a[href]');

    // Cell 1: background image (field:media_image)
    const imageFrag = document.createDocumentFragment();
    if (bgImage) {
      imageFrag.appendChild(document.createComment(' field:media_image '));
      imageFrag.appendChild(bgImage);
    }

    // Cell 2: text content (field:content_text)
    const textFrag = document.createDocumentFragment();
    textFrag.appendChild(document.createComment(' field:content_text '));
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
      a.textContent = (cta.textContent || '').trim() || 'Buy now';
      p.appendChild(a);
      textFrag.appendChild(p);
    }

    cells.push([imageFrag, textFrag]);
  });

  if (!cells.length) {
    element.remove();
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-promo', cells });
  element.replaceWith(block);
}
