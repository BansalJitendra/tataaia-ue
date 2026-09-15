/* eslint-disable */
/* global WebImporter */

/**
 * Parser for carousel-video variant. Base: carousel.
 * Source: Tata AIA homepage — .youtubevideoandreels
 * Model: container with carousel-video-item children.
 *   Item fields: media_image (reference), media_imageAlt (collapsed), content_text (richtext)
 *   Grouped: media_* in first cell; content_* in second cell.
 * Each slide (.videoIframe) has a thumbnail poster image, a title, and a YouTube video URL.
 */
export default function parse(element, { document }) {
  function pickThumb(slide) {
    // Prefer the explicit data-thumbnail attribute, else the poster <img>
    const thumb = slide.getAttribute('data-thumbnail');
    if (thumb) {
      const img = document.createElement('img');
      img.setAttribute('src', thumb);
      const title = slide.getAttribute('data-card-title');
      if (title) img.setAttribute('alt', title);
      return img;
    }
    const posterImg = slide.querySelector('.reels-poster img, picture img, img');
    if (posterImg) {
      const src = posterImg.getAttribute('src') || posterImg.getAttribute('data-src');
      if (src) {
        const img = document.createElement('img');
        img.setAttribute('src', src);
        const alt = posterImg.getAttribute('alt');
        if (alt) img.setAttribute('alt', alt);
        return img;
      }
    }
    return null;
  }

  const slides = Array.from(element.querySelectorAll('.videoIframe, .swiper-slide'));
  const cells = [];

  slides.forEach((slide) => {
    const img = pickThumb(slide);
    const videoUrl = slide.getAttribute('data-video-source');
    const titleAttr = slide.getAttribute('data-card-title');
    const titleEl = slide.querySelector('.reels-title, p');
    const title = titleAttr || (titleEl ? titleEl.textContent.trim() : '');

    // Column 1: media_image field
    const mediaFrag = document.createDocumentFragment();
    if (img) {
      mediaFrag.appendChild(document.createComment(' field:media_image '));
      mediaFrag.appendChild(img);
    }

    // Column 2: content_text field — title as a link to the video
    const contentFrag = document.createDocumentFragment();
    contentFrag.appendChild(document.createComment(' field:content_text '));
    if (title) {
      const p = document.createElement('p');
      if (videoUrl) {
        const a = document.createElement('a');
        a.setAttribute('href', videoUrl);
        a.textContent = title;
        p.appendChild(a);
      } else {
        p.textContent = title;
      }
      contentFrag.appendChild(p);
    }

    if (img || title) cells.push([mediaFrag, contentFrag]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-video', cells });
  element.replaceWith(block);
}
