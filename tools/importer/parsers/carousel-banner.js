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

    // One slide row = two cells (mirrors the working carousel-review item):
    //   cell 1: image (field:image) — the banner picture, optionally linked
    //   cell 2: imageAlt (field:imageAlt) — the banner title/alt text
    // Only the desktop image is modeled for authoring; CSS still swaps the
    // mobile variant in the rendered .plain.html when both are present.
    // A `reference` field holds a bare image (no link wrapper), so the banner
    // link is not modeled here — the image alone maps cleanly to field:image.
    const imgCell = document.createElement('div');
    imgCell.appendChild(document.createComment(' field:media_image '));
    const p = document.createElement('p');
    const pic = buildPicture(deskSrc || mobSrc, title);
    if (pic) p.appendChild(pic);
    imgCell.appendChild(p);

    const altCell = document.createElement('div');
    altCell.appendChild(document.createComment(' field:media_imageAlt '));
    if (title) altCell.appendChild(document.createTextNode(title));

    cells.push([imgCell, altCell]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-banner', cells });
  element.replaceWith(block);
}
