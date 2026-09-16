/*
 * Columns Product Recom block.
 * Source: .product-recom-banner on tataaia.com — the "Can't decide on a term
 * insurance plan?" callout that sits under the Life Insurance intro. Two visible
 * panels: a left pitch panel with a short pitch + check-mark bullets over an
 * illustration, and a right plan card (best-seller ribbon, plan name, price,
 * key details, benefit list and a CTA). Built on the columns component so the
 * mixed multi-column content converts cleanly to JCR.
 *
 * Authored structure (one row, three columns):
 *   - col 1: the left illustration image
 *   - col 2: left copy — heading, "Share your needs and get", bullets, fine print
 *   - col 3: right copy — best-seller line, plan name, price, details, benefit
 *     list and a CTA <a>
 */
export default function decorate(block) {
  const row = block.firstElementChild;
  const cells = row ? [...row.children] : [];
  const imageCell = cells.find((c) => c.querySelector('picture, img'));
  const textCells = cells.filter((c) => c !== imageCell);
  const [leftCell, rightCell] = textCells;

  block.textContent = '';

  // --- left panel: illustration + pitch copy ---
  const left = document.createElement('div');
  left.className = 'columns-product-recom-left';
  if (imageCell) {
    const media = document.createElement('div');
    media.className = 'columns-product-recom-media';
    const pic = imageCell.querySelector('picture') || imageCell.querySelector('img');
    if (pic) media.append(pic);
    left.append(media);
  }
  if (leftCell) {
    const copy = document.createElement('div');
    copy.className = 'columns-product-recom-left-copy';
    while (leftCell.firstChild) copy.append(leftCell.firstChild);
    copy.querySelectorAll('li').forEach((li) => li.classList.add('columns-product-recom-check'));
    left.append(copy);
  }

  // --- right panel: plan card ---
  const right = document.createElement('div');
  right.className = 'columns-product-recom-right';
  if (rightCell) {
    while (rightCell.firstChild) right.append(rightCell.firstChild);
    const first = right.querySelector('p');
    if (first && /best\s*seller/i.test(first.textContent) && first.textContent.trim().length < 20) {
      first.classList.add('columns-product-recom-ribbon');
    }
    right.querySelectorAll('a').forEach((a) => {
      const p = a.closest('p');
      if (p && p.textContent.trim() === a.textContent.trim()) {
        a.classList.add('button');
        p.classList.add('columns-product-recom-cta');
      }
    });
    right.querySelectorAll('li').forEach((li) => li.classList.add('columns-product-recom-benefit'));
  }

  block.append(left, right);
}
