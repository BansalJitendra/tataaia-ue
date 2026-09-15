// Tata AIA footer — content-first.
// Reads content/footer.plain.html (3 sections: brand+social, link columns, legal)
// and renders a multi-column footer (desktop) that collapses to accordions (mobile).

const isDesktop = window.matchMedia('(min-width: 900px)');

export default async function decorate(block) {
  // metadata-independent dual-fetch: /content first (localhost), then root (DA/EDS prod)
  let resp = await fetch('/content/footer.plain.html');
  if (!resp.ok) resp = await fetch('/footer.plain.html');
  if (!resp.ok) return;
  const html = await resp.text();

  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  const [brandSec, columnsSec, legalSec] = [...tmp.children];

  block.textContent = '';
  const footer = document.createElement('div');
  footer.className = 'footer-inner';

  // ---- brand + social ----
  if (brandSec) {
    const brand = document.createElement('div');
    brand.className = 'footer-brand';
    while (brandSec.firstChild) brand.append(brandSec.firstChild);
    brand.querySelectorAll('p').forEach((p) => {
      if (p.querySelector('a')) p.classList.add('footer-social');
      else if (p.querySelector('img')) p.classList.add('footer-logo');
    });
    footer.append(brand);
  }

  // ---- link columns (accordion on mobile) ----
  if (columnsSec) {
    const list = columnsSec.querySelector(':scope > ul');
    if (list) {
      list.classList.add('footer-columns');
      list.querySelectorAll(':scope > li').forEach((col) => {
        col.classList.add('footer-column');
        const heading = col.querySelector(':scope > a');
        if (heading) {
          heading.classList.add('footer-column-title');
          heading.setAttribute('aria-expanded', 'false');
          heading.addEventListener('click', (e) => {
            if (!isDesktop.matches) {
              e.preventDefault();
              const open = col.classList.toggle('footer-column-open');
              heading.setAttribute('aria-expanded', String(open));
            }
          });
        }
      });
      footer.append(list);
    }
  }

  // ---- legal / copyright ----
  if (legalSec) {
    const legal = document.createElement('div');
    legal.className = 'footer-legal';
    while (legalSec.firstChild) legal.append(legalSec.firstChild);
    footer.append(legal);
  }

  block.append(footer);

  // reset accordion state when crossing to desktop
  isDesktop.addEventListener('change', () => {
    block.querySelectorAll('.footer-column-open').forEach((c) => c.classList.remove('footer-column-open'));
    block.querySelectorAll('.footer-column-title').forEach((t) => t.setAttribute('aria-expanded', 'false'));
  });
}
