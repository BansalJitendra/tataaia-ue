import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Hero Promo block.
 * Full-bleed dark banner: a background image with foreground content layered
 * on top -- an eyebrow, a large heading, a row of badge "chips" inside a
 * translucent rounded box, optional fine print, and a CTA button.
 *
 * Authored structure (one column, two rows):
 *   - row 1: the background image (a <picture> / <img>)
 *   - row 2: the text content -- eyebrow <p>, heading <p>, one or more short
 *     badge <p>, a long fine-print <p>, and a <p><a> CTA (in that order).
 */
export default function decorate(block) {
  const content = document.createElement('div');
  content.className = 'hero-promo-content';

  let background = null;
  let backgroundSrc = null;
  const paras = [];
  const isImageUrl = (url) => /\.(png|jpe?g|webp|gif|svg|avif)(\?|$)/i.test(url || '');

  [...block.children].forEach((row) => {
    const picture = row.querySelector('picture');
    const img = row.querySelector('img');
    // A row whose only meaningful payload is an image is the background.
    if ((picture || img) && !row.textContent.trim()) {
      background = picture || img;
      return;
    }
    // Some pipelines deliver the background as a bare link to an image file
    // (its href/text is an image URL). Treat such a row as the background.
    const soleLink = row.querySelector('a');
    if (soleLink && isImageUrl(soleLink.getAttribute('href'))
      && row.querySelectorAll('a').length === 1
      && row.textContent.trim() === soleLink.textContent.trim()) {
      backgroundSrc = soleLink.getAttribute('href');
      return;
    }
    // Otherwise collect the paragraph-level content from each cell.
    [...row.children].forEach((cell) => {
      [...cell.children].forEach((node) => paras.push(node));
    });
  });

  block.textContent = '';

  // Classify the collected paragraphs.
  const badges = document.createElement('div');
  badges.className = 'hero-promo-badges';

  paras.forEach((node, i) => {
    const hasLink = node.querySelector('a');
    const text = node.textContent.trim();

    if (hasLink) {
      // CTA -- keep as its own button container.
      const link = node.querySelector('a');
      link.classList.add('button');
      const container = document.createElement('p');
      container.className = 'button-container';
      container.append(link);
      content.append(container);
    } else if (i === 0) {
      node.classList.add('hero-promo-eyebrow');
      content.append(node);
    } else if (i === 1) {
      const h = document.createElement('h2');
      h.className = 'hero-promo-heading';
      h.innerHTML = node.innerHTML;
      content.append(h);
    } else if (text.length > 120) {
      node.classList.add('hero-promo-fineprint');
      content.append(node);
    } else {
      node.classList.add('hero-promo-chip');
      badges.append(node);
    }
  });

  // Insert the badge box right after the heading (before fine print / CTA).
  if (badges.children.length) {
    const heading = content.querySelector('.hero-promo-heading');
    if (heading) heading.after(badges);
    else content.prepend(badges);
  }

  if (background || backgroundSrc) {
    const bg = document.createElement('div');
    bg.className = 'hero-promo-bg';
    if (backgroundSrc) {
      bg.append(createOptimizedPicture(backgroundSrc, '', true));
    } else if (background.tagName === 'IMG') {
      bg.append(createOptimizedPicture(background.src, background.alt, true));
    } else {
      bg.append(background);
    }
    block.append(bg);
  }

  block.append(content);
}
