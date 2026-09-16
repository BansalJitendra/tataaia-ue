/*
 * Columns block (base EDS columns component).
 *
 * On this crosswalk project several authored variants — the "Life Insurance" /
 * "Types of Life Insurance" intros and the "Can't decide" product-recommendation
 * callout — are built on the columns component, so AEM renders them all with the
 * plain `columns` class (the custom block name is dropped). This decorator
 * therefore detects those variants by content and applies the right treatment
 * here, since this is the block code that actually loads on delivery.
 */

// Turn baked-in "… Read more … Read less" copy into a working toggle.
function enhanceReadMore(cell) {
  const html = cell.innerHTML;
  const moreRe = /(?:\.\.\.|…)?\s*Read\s*more/i;
  const lessRe = /Read\s*less/i;
  const moreMatch = html.match(moreRe);
  const lessMatch = html.match(lessRe);
  if (!moreMatch || !lessMatch || lessMatch.index < moreMatch.index) return;

  const before = html.slice(0, moreMatch.index);
  const hidden = html.slice(moreMatch.index + moreMatch[0].length, lessMatch.index);
  const after = html.slice(lessMatch.index + lessMatch[0].length);

  cell.innerHTML = '';
  const visible = document.createElement('span');
  visible.className = 'columns-text-visible';
  visible.innerHTML = before;
  const dots = document.createElement('span');
  dots.className = 'columns-ellipsis';
  dots.textContent = '… ';
  const more = document.createElement('button');
  more.type = 'button';
  more.className = 'columns-readmore';
  more.textContent = 'Read more';
  const extra = document.createElement('span');
  extra.className = 'columns-text-extra';
  extra.hidden = true;
  extra.innerHTML = hidden + after;
  const less = document.createElement('button');
  less.type = 'button';
  less.className = 'columns-readless';
  less.textContent = 'Read less';
  less.hidden = true;

  const expand = (open) => {
    extra.hidden = !open;
    less.hidden = !open;
    dots.hidden = open;
    more.hidden = open;
  };
  more.addEventListener('click', () => expand(true));
  less.addEventListener('click', () => expand(false));
  cell.append(visible, dots, more, extra, less);
}

// The product-recommendation callout ("Can't decide on a term insurance plan?"):
// a 3-cell columns block whose right column has a "Best Seller" line + a plan
// heading + benefit list + a CTA. Style it as the live callout card.
function decorateProductRecom(block) {
  const cols = [...(block.firstElementChild?.children || [])];
  if (cols.length < 3) return false;
  const text = block.textContent;
  if (!/best\s*seller/i.test(text) || !/decide on a term/i.test(text)) return false;

  block.classList.add('columns-product-recom');
  const imageCol = cols.find((c) => c.querySelector('picture, img'));
  const rest = cols.filter((c) => c !== imageCol);
  const [leftCol, rightCol] = rest;

  if (leftCol) {
    leftCol.classList.add('columns-recom-left');
    leftCol.querySelectorAll('li').forEach((li) => li.classList.add('columns-recom-check'));
    // Fold the illustration into the left pitch panel (one visual card, like live).
    if (imageCol) {
      const pic = imageCol.querySelector('picture') || imageCol.querySelector('img');
      if (pic) {
        const media = document.createElement('div');
        media.className = 'columns-recom-media';
        media.append(pic);
        leftCol.append(media);
      }
      imageCol.remove();
    }
  }
  if (rightCol) {
    rightCol.classList.add('columns-recom-right');
    const ribbon = [...rightCol.querySelectorAll('p')]
      .find((p) => /best\s*seller/i.test(p.textContent) && p.textContent.trim().length < 20);
    if (ribbon) ribbon.classList.add('columns-recom-ribbon');
    rightCol.querySelectorAll('li').forEach((li) => li.classList.add('columns-recom-benefit'));
    rightCol.querySelectorAll('a').forEach((a) => {
      const p = a.closest('p');
      if (p && p.textContent.trim() === a.textContent.trim()) {
        a.classList.add('button');
        p.classList.add('columns-recom-cta');
      }
    });
  }
  return true;
}

export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  // Variant: product-recommendation callout.
  const isRecom = decorateProductRecom(block);

  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('columns-img-col');
        }
      }
    });
  });

  // Variant: "Life Insurance" / "Types of Life Insurance" intros — gradient
  // heading + Read more/Read less toggle. Only when not the recom callout.
  if (!isRecom) {
    const hasHeading = block.querySelector('h1, h2, h3');
    [...block.querySelectorAll(':scope > div > div')].forEach((cell) => {
      if (/Read\s*more/i.test(cell.textContent) && /Read\s*less/i.test(cell.textContent)) {
        enhanceReadMore(cell);
      }
    });
    if (hasHeading) block.classList.add('columns-intro');
  }
}
