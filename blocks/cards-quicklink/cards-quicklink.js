import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * cards-quicklink: a centered row of compact icon + label quick-link tiles.
 *
 * Authored rows contain two cells:
 *   cell 1 -> icon (either <picture>/<img> or, after import, an <a href="...svg">)
 *   cell 2 -> <h3><a href="...">Label</a></h3>
 *
 * Each row is rebuilt into a single clickable tile:
 *   <li><a href="{destination}"><img class="cards-quicklink-icon"><span>Label</span></a></li>
 */
export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    const iconCell = cells[0];
    const textCell = cells[1] || cells[0];

    // Resolve the icon source: prefer an <img>, otherwise an <a href> pointing at an image.
    let iconSrc = '';
    let iconAlt = '';
    const iconImg = iconCell?.querySelector('img');
    if (iconImg) {
      iconSrc = iconImg.getAttribute('src');
      iconAlt = iconImg.getAttribute('alt') || '';
    } else {
      const iconLink = iconCell?.querySelector('a');
      if (iconLink) {
        iconSrc = iconLink.getAttribute('href');
        iconAlt = iconLink.textContent.trim();
      }
    }

    // Resolve the label + destination from the text cell.
    const labelLink = textCell?.querySelector('a');
    const label = (labelLink?.textContent || textCell?.textContent || '').trim();
    const href = labelLink?.getAttribute('href') || '#';

    const li = document.createElement('li');
    moveInstrumentation(row, li);

    const link = document.createElement('a');
    link.className = 'cards-quicklink-link';
    link.href = href;
    link.setAttribute('aria-label', label);

    if (iconSrc) {
      const img = document.createElement('img');
      img.className = 'cards-quicklink-icon';
      img.src = iconSrc;
      img.alt = iconAlt || label;
      img.loading = 'lazy';
      img.decoding = 'async';
      img.width = 54;
      img.height = 54;
      // Defensive: if the DAM asset 404s (e.g. on localhost) keep the reserved
      // space but hide the broken-image glyph so the tile layout stays intact.
      img.addEventListener('error', () => { img.style.visibility = 'hidden'; });
      link.append(img);
    }

    const span = document.createElement('span');
    span.className = 'cards-quicklink-label';
    span.textContent = label;
    link.append(span);

    li.append(link);
    ul.append(li);
  });

  block.textContent = '';
  block.append(ul);
}
