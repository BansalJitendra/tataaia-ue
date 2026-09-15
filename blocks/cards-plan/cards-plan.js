import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);
    const cells = [...li.children];
    cells.forEach((div, i) => {
      // Content model: first cell is the icon/image, remaining cell(s) the body.
      if (i === 0) div.className = 'cards-plan-card-image';
      else div.className = 'cards-plan-card-body';
    });
    // Within the body, a leading <p> that precedes the plan heading is the
    // discount/returns ribbon tag (not every card has one).
    const body = li.querySelector('.cards-plan-card-body');
    if (body) {
      const first = body.firstElementChild;
      const heading = body.querySelector('h3');
      // The tag is a <p> that appears before the plan-name heading in the body.
      const tagBeforeHeading = first && heading
        // eslint-disable-next-line no-bitwise
        && (first.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
      if (first && first.tagName === 'P' && tagBeforeHeading) {
        first.classList.add('cards-plan-tag');
      }
    }
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '200' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });
  block.textContent = '';
  block.append(ul);
}
