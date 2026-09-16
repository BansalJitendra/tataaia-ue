/* eslint-disable */
/* global WebImporter */

/**
 * Parser for carousel-banner variant. Base: carousel.
 * Source: Tata AIA homepage — .banner-slider (promo banner swiper between the
 * "Why choose" stats and the IRDAI Bima Bharosa banner).
 *
 * Follows the carousel convention: the block's first row is the block name
 * (handled by createBlock); each subsequent row is ONE slide. For a banner
 * carousel each slide row has a single Image cell (the mandatory image),
 * holding both the desktop and mobile <picture> variants (desktop first,
 * mobile second) wrapped in the banner link when present. No title/CTA cells.
 */
export default function parse(element, { document }) {
  const slides = Array.from(element.querySelectorAll('.extendedimage'));

  const resolveSrc = (img) => (img
    && (img.getAttribute('src') || img.getAttribute('data-src') || img.getAttribute('data-cmp-src')))
    || null;

  const buildPicture = (src, alt) => {
    if (!src) return null;
    const picture = document.createElement('picture');
    const img = document.createElement('img');
    img.setAttribute('src', src);
    if (alt) img.setAttribute('alt', alt);
    picture.appendChild(img);
    return picture;
  };

  const cells = [];
  slides.forEach((slide) => {
    // Desktop image + its link.
    const deskLink = slide.querySelector('a.cmp-image__link');
    const deskImg = slide.querySelector('.cmp-image__image, [data-cmp-hook-image="image"]')
      || (deskLink ? deskLink.querySelector('img') : null);
    // Mobile image + its link.
    const mobAnchor = slide.querySelector('a.extended__mobileanchor');
    const mobImg = slide.querySelector('.extended__mobileanchorimage, .extended__mobileimage')
      || (mobAnchor ? mobAnchor.querySelector('img') : null);

    const title = slide.getAttribute('data-title')
      || (deskImg && deskImg.getAttribute('alt'))
      || '';
    const href = (deskLink && deskLink.getAttribute('href'))
      || (mobAnchor && mobAnchor.getAttribute('href'))
      || null;

    const deskSrc = resolveSrc(deskImg);
    const mobSrc = resolveSrc(mobImg);
    if (!deskSrc && !mobSrc) return;

    // Single Image cell per slide row (the mandatory carousel image).
    const cell = document.createElement('div');
    const deskPara = document.createElement('p');
    const mobPara = document.createElement('p');
    const deskPic = buildPicture(deskSrc, title);
    const mobPic = buildPicture(mobSrc || deskSrc, title);

    if (href) {
      const a1 = document.createElement('a');
      a1.setAttribute('href', href);
      if (deskPic) a1.appendChild(deskPic);
      deskPara.appendChild(a1);
      const a2 = document.createElement('a');
      a2.setAttribute('href', href);
      if (mobPic) a2.appendChild(mobPic);
      mobPara.appendChild(a2);
    } else {
      if (deskPic) deskPara.appendChild(deskPic);
      if (mobPic) mobPara.appendChild(mobPic);
    }

    if (deskPara.childNodes.length) cell.appendChild(deskPara);
    if (mobPara.childNodes.length) cell.appendChild(mobPara);
    if (cell.childNodes.length) cells.push([cell]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-banner', cells });
  element.replaceWith(block);
}
