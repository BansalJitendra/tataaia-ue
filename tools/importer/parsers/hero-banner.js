/* eslint-disable */
/* global WebImporter */

/**
 * Parser for hero-banner variant. Base: hero.
 * Source: Tata AIA homepage — .banner-asset-container
 * Model: simple block, fields: image (reference), imageAlt (collapsed), text (richtext)
 * Structure (from library): 1 column, up to 3 rows — name, background image, text content.
 * The source container primarily holds slider chrome (nav arrows/pagination); this parser
 * extracts a genuine banner background image (ignoring control icons) plus any heading/text.
 */
export default function parse(element, { document }) {
  function normalizeImg(img) {
    if (!img) return null;
    const src = img.getAttribute('src') || img.getAttribute('data-src')
      || img.getAttribute('data-asset') || img.getAttribute('data-cmp-filereference');
    if (!src) return null;
    // Skip navigation/control icons
    if (/prev-arrow|next-arrow|common-icons|arrow\.svg/i.test(src)) return null;
    const out = document.createElement('img');
    out.setAttribute('src', src);
    const alt = img.getAttribute('alt');
    if (alt && !/prev|next|button/i.test(alt)) out.setAttribute('alt', alt);
    return out;
  }

  // Background image: first real image that is not a slider control
  let bgImage = null;
  const pictureSource = element.querySelector('picture source[srcset], picture source[data-srcset]');
  if (pictureSource) {
    const src = pictureSource.getAttribute('srcset') || pictureSource.getAttribute('data-srcset');
    if (src) {
      bgImage = document.createElement('img');
      bgImage.setAttribute('src', src.split(',')[0].trim().split(' ')[0]);
    }
  }
  if (!bgImage) {
    const imgs = Array.from(element.querySelectorAll('img'));
    for (const img of imgs) {
      const norm = normalizeImg(img);
      if (norm) { bgImage = norm; break; }
    }
  }

  // Text content: headings, paragraphs, CTA links (excluding slider controls)
  const heading = element.querySelector('h1, h2, h3, .banner-title, [class*="title"]:not([class*="banner-slider"])');
  const paras = Array.from(element.querySelectorAll('p')).filter((p) => p.textContent.trim());
  const ctas = Array.from(element.querySelectorAll('a[href]')).filter((a) => a.textContent.trim() && !/slide/i.test(a.getAttribute('aria-label') || ''));

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
  if (heading && heading.textContent.trim()) {
    const h = document.createElement('h2');
    h.textContent = heading.textContent.trim();
    textFrag.appendChild(h);
  }
  paras.forEach((p) => {
    const np = document.createElement('p');
    np.innerHTML = p.innerHTML;
    textFrag.appendChild(np);
  });
  ctas.forEach((a) => {
    const p = document.createElement('p');
    const link = document.createElement('a');
    link.setAttribute('href', a.getAttribute('href'));
    link.textContent = a.textContent.trim();
    p.appendChild(link);
    textFrag.appendChild(p);
  });
  cells.push([textFrag]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-banner', cells });
  element.replaceWith(block);
}
