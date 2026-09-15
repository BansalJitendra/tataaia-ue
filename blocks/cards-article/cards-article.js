import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-article-card-image';
      else div.className = 'cards-article-card-body';
    });

    // Match source: overlay the short category label on the image (top-right tag).
    const imageDiv = li.querySelector('.cards-article-card-image');
    const bodyDiv = li.querySelector('.cards-article-card-body');
    if (imageDiv && bodyDiv) {
      const firstP = bodyDiv.querySelector(':scope > p');
      // Category label = a lone <p> with only text (no links/headings) as the first body child.
      if (firstP && bodyDiv.firstElementChild === firstP
        && !firstP.querySelector('a, h1, h2, h3, h4, h5, h6, picture, img')) {
        const tag = document.createElement('span');
        tag.className = 'cards-article-tag';
        tag.textContent = firstP.textContent.trim();
        firstP.remove();
        imageDiv.append(tag);
      }
    }

    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '400' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });
  block.textContent = '';
  block.append(ul);
}
