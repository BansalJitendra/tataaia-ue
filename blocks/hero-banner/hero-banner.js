import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Hero Banner block.
 * Full-width mid-page / regulatory banner. On the source (tataaia.com) this is
 * a single full-bleed illustrated image (1206x400, ~3:1) with logos, a short
 * paragraph and a "Know More" CTA baked into the artwork; the whole banner is a
 * link. It can also be authored as an illustrated background with real
 * foreground content (logo(s), paragraph, CTA) layered on top.
 *
 * Authored structure (one column, up to a few rows):
 *   - a row holding the banner / background image (a <picture> / <img>), or a
 *     bare link whose href/text is an image URL (some import pipelines deliver
 *     background art that way -- handled gracefully), optionally wrapped in a
 *     link that is the banner's click target;
 *   - optional row(s) of text content (logos, paragraph, CTA) to overlay.
 *
 * Behaviour:
 *   - image only  -> render the image as a plain full-width banner (its own
 *     aspect ratio drives the height), linked if a click target was found;
 *   - image + text -> the image becomes an absolutely-positioned background and
 *     the text is layered on top as foreground content.
 */
const isImageUrl = (url) => /\.(png|jpe?g|webp|gif|svg|avif)(\?|$)/i.test(url || '');

export default function decorate(block) {
  const content = document.createElement('div');
  content.className = 'hero-banner-content';

  let background = null; // <picture> or <img> element
  let backgroundSrc = null; // image URL delivered as a bare/auto link
  let bannerHref = null; // click target for the whole banner

  [...block.children].forEach((row) => {
    const picture = row.querySelector('picture');
    const img = row.querySelector('img');

    // A row whose only meaningful payload is an image is the banner art.
    if ((picture || img) && !row.textContent.trim()) {
      background = picture || img;
      // If that image is wrapped in a link, remember it as the banner target.
      const wrap = (picture || img).closest('a');
      if (wrap && wrap.getAttribute('href')) bannerHref = wrap.getAttribute('href');
      return;
    }

    // Some pipelines deliver the banner art as a bare link to an image file
    // (its href/text is an image URL). Treat such a row as the banner art.
    const soleLink = row.querySelector('a');
    if (soleLink && isImageUrl(soleLink.getAttribute('href'))
      && row.querySelectorAll('a').length === 1
      && row.textContent.trim() === soleLink.textContent.trim()) {
      backgroundSrc = soleLink.getAttribute('href');
      return;
    }

    // Otherwise move each cell's content into the foreground container.
    [...row.children].forEach((cell) => {
      while (cell.firstChild) content.append(cell.firstChild);
    });
  });

  // Auto-decorate any lone <p><a> in the foreground as a CTA button.
  content.querySelectorAll('a').forEach((a) => {
    const p = a.closest('p');
    if (p && p.textContent.trim() === a.textContent.trim()) {
      a.classList.add('button');
      p.classList.add('button-container');
    }
  });

  const hasForeground = content.textContent.trim().length > 0
    || content.querySelector('img, picture');

  block.textContent = '';

  // Build the banner image element (if any).
  let bannerImg = null;
  if (backgroundSrc) {
    bannerImg = createOptimizedPicture(backgroundSrc, '', true);
  } else if (background) {
    bannerImg = background.tagName === 'IMG'
      ? createOptimizedPicture(background.src, background.alt || '', true)
      : background;
  }

  if (bannerImg && !hasForeground) {
    // Image-only banner: render inline, preserving its own aspect ratio.
    const media = document.createElement('div');
    media.className = 'hero-banner-media';
    if (bannerHref) {
      const a = document.createElement('a');
      a.href = bannerHref;
      a.append(bannerImg);
      media.append(a);
    } else {
      media.append(bannerImg);
    }
    block.append(media);
    return;
  }

  if (bannerImg) {
    // Background art behind foreground content.
    const bg = document.createElement('div');
    bg.className = 'hero-banner-bg';
    bg.append(bannerImg);
    block.append(bg);
  }

  block.append(content);
}
