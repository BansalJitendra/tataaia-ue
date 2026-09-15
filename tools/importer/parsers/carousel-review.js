/* eslint-disable */
/* global WebImporter */

/**
 * Parser for carousel-review variant. Base: carousel.
 * Source: Tata AIA homepage — .voiceof-happy-customer
 * Model: container with carousel-review-item children.
 *   Item fields: media_image (reference), media_imageAlt (collapsed), content_text (richtext)
 *   Grouped: media_* in first cell; content_* in second cell.
 * Each review slide (.newextendedteaser) has a customer photo plus name/company/plan/quote text.
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
  // review slide, so it can be emitted as section-level default content.
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

  const sectionHeading = extractSectionHeading('.newextendedteaser');
  const slides = Array.from(element.querySelectorAll('.newextendedteaser.teaser, .newextendedteaser'));
  const cells = [];

  slides.forEach((slide) => {
    // Customer photo: prefer the portrait (.profile-image-wrapper), never the decorative
    // quote/star icons (which live in .second-image and hard-code-icons paths).
    let img = normalizeImg(slide.querySelector('.profile-image-wrapper img'));
    if (!img) {
      const imgs = Array.from(slide.querySelectorAll('img')).map((i) => {
        const src = i.getAttribute('src') || i.getAttribute('data-src') || '';
        return { i, src };
      }).filter(({ src }) => src && !/quote\.svg|fullstar\.svg|halfstar\.svg|common-icons/i.test(src));
      if (imgs.length) img = normalizeImg(imgs[imgs.length - 1].i);
    }

    const title = slide.querySelector('.title');
    const company = slide.querySelector('.company-name');
    const pretitle = slide.querySelector('.pretitle');
    const desc = slide.querySelector('.description');

    // Column 1: media_image field
    const mediaFrag = document.createDocumentFragment();
    if (img) {
      mediaFrag.appendChild(document.createComment(' field:media_image '));
      mediaFrag.appendChild(img);
    }

    // Column 2: content_text field — name, company, plan, and review quote
    const contentFrag = document.createDocumentFragment();
    contentFrag.appendChild(document.createComment(' field:content_text '));
    if (title && title.textContent.trim()) {
      const h = document.createElement('h3');
      h.textContent = title.textContent.trim();
      contentFrag.appendChild(h);
    }
    [company, pretitle, desc].forEach((el) => {
      if (el && el.textContent.trim()) {
        const p = document.createElement('p');
        p.textContent = el.textContent.trim();
        contentFrag.appendChild(p);
      }
    });

    if (img || title || desc) cells.push([mediaFrag, contentFrag]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-review', cells });
  // Emit the section heading as default content BEFORE the block table so it
  // survives into the output as section-level content (not inside a slide cell).
  if (sectionHeading) {
    element.replaceWith(sectionHeading, block);
  } else {
    element.replaceWith(block);
  }
}
