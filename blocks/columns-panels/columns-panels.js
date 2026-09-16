/*
 * Columns Panels block.
 * Used for the Tata AIA "Life Insurance" / "Types of Life Insurance" intro
 * panels: a centered gradient heading with a body-copy description below.
 *
 * Read more / Read less: the source bakes the collapse markers into the copy as
 * literal text — "…<visible>… Read more <hidden continuation> Read less". This
 * decorator turns that into a working toggle: the continuation is hidden by
 * default behind a "Read more" link and revealed (with a "Read less" link) on
 * click. If the markers aren't present the text is left untouched.
 */

function enhanceReadMore(cell) {
  // Work on the raw HTML so we can split on the literal markers regardless of
  // how <br> / inline tags are interleaved.
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
  visible.className = 'columns-panels-text-visible';
  visible.innerHTML = before;

  const dots = document.createElement('span');
  dots.className = 'columns-panels-ellipsis';
  dots.textContent = '… ';

  const more = document.createElement('button');
  more.type = 'button';
  more.className = 'columns-panels-readmore';
  more.textContent = 'Read more';

  const extra = document.createElement('span');
  extra.className = 'columns-panels-text-extra';
  extra.hidden = true;
  extra.innerHTML = hidden + after;

  const less = document.createElement('button');
  less.type = 'button';
  less.className = 'columns-panels-readless';
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

export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-panels-${cols.length}-cols`);

  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          picWrapper.classList.add('columns-panels-img-col');
        }
      }
    });
  });

  // Turn baked-in "Read more … Read less" copy into a working toggle.
  block.querySelectorAll(':scope > div > div:last-child').forEach((cell) => {
    if (/Read\s*more/i.test(cell.textContent) && /Read\s*less/i.test(cell.textContent)) {
      enhanceReadMore(cell);
    }
  });
}
