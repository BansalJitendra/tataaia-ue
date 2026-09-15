import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Hero Promo block.
 * Full-bleed banner: a background image with foreground content
 * (eyebrow, heading, badge chips, CTA) layered on top.
 *
 * Expected authored structure (one column, up to a few rows):
 *   - a row containing the background image (a <picture> / <img>)
 *   - a row containing the text content (eyebrow, heading, badges, CTA)
 * Rows may arrive in either order; images become the background and
 * everything else becomes the foreground content.
 */
export default function decorate(block) {
  const content = document.createElement('div');
  content.className = 'hero-promo-content';

  let background = null;

  [...block.children].forEach((row) => {
    const picture = row.querySelector('picture');
    const img = row.querySelector('img');
    // A row whose only meaningful payload is an image is the background.
    if ((picture || img) && !row.textContent.trim()) {
      background = picture || img;
      return;
    }
    // Otherwise move each cell's content into the foreground container.
    [...row.children].forEach((cell) => {
      while (cell.firstChild) content.append(cell.firstChild);
    });
  });

  block.textContent = '';

  if (background) {
    const bg = document.createElement('div');
    bg.className = 'hero-promo-bg';
    if (background.tagName === 'IMG') {
      bg.append(createOptimizedPicture(background.src, background.alt, true));
    } else {
      bg.append(background);
    }
    block.append(bg);
  }

  block.append(content);
}
