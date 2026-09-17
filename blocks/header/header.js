// Tata AIA header — content-first.
// Reads content/nav.plain.html (4 sections: brand, menu tree, CTAs, promo bar),
// builds a solid white header bar with megamenu dropdowns, utility icons, and a
// mobile drawer. All copy/links/images come from the fragment; this file only
// builds structure + behavior.

const isDesktop = window.matchMedia('(min-width: 900px)');

// inline SVG icons for utility controls (not content)
const ICONS = {
  // Live uses an animated "Call us" GIF here (not a line icon). Shipped as an
  // own-origin asset so it renders as a real <img> on delivery.
  phone: '<img class="nav-icon-img" src="/icons/nav-call-us.gif" alt="" width="24" height="24" loading="lazy">',
  search: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
  account: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
};

/** Tag product-card badges: an <em> the fragment places before a product link. */
function decorateBadges(panel) {
  panel.querySelectorAll('li > em').forEach((em) => {
    em.classList.add('nav-badge');
    const li = em.closest('li');
    if (li) li.classList.add('nav-has-badge');
  });
}

/** Classify a top-level dropdown panel: simple link list vs grouped mega panel. */
function decorateDropdown(li) {
  const panel = li.querySelector(':scope > ul');
  if (!panel) return;
  panel.classList.add('nav-dropdown');
  const hasGroups = !!panel.querySelector(':scope > li > ul');
  if (hasGroups) {
    panel.classList.add('nav-dropdown-mega');
    panel.querySelectorAll(':scope > li').forEach((group) => group.classList.add('nav-dropdown-group'));
    decorateBadges(panel);
  } else {
    panel.classList.add('nav-dropdown-simple');
  }
}

function toggleTopItem(li, expanded) {
  const trigger = li.querySelector(':scope > a');
  li.classList.toggle('nav-open', expanded);
  if (trigger) trigger.setAttribute('aria-expanded', String(expanded));
}

function closeAll(navMenu) {
  navMenu.querySelectorAll(':scope > ul > li.nav-open').forEach((li) => toggleTopItem(li, false));
}

export default async function decorate(block) {
  // metadata-independent dual-fetch. On localhost the content lives under
  // /content; on DA/EDS prod it is served from the root. Probe the likely path
  // for the current host FIRST so production doesn't emit a wasted 404.
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const paths = isLocal ? ['/content/nav.plain.html', '/nav.plain.html'] : ['/nav.plain.html', '/content/nav.plain.html'];
  let resp = await fetch(paths[0]);
  if (!resp.ok) resp = await fetch(paths[1]);
  if (!resp.ok) return;
  const html = await resp.text();

  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  const [brandSec, menuSec, ctaSec, promoSec] = [...tmp.children];

  block.textContent = '';
  const header = document.createElement('div');
  header.className = 'nav-wrapper';

  // promo bar (row 2) — a right-to-left scrolling ticker of announcement
  // messages (matches the live .ticker-wrap strip below the nav). Built here
  // but appended AFTER the nav bar so it sits below the nav (and above the
  // hero promo), like live.
  let promo = null;
  if (promoSec) {
    promo = document.createElement('div');
    promo.className = 'nav-promo';

    const messages = [...promoSec.querySelectorAll('li')];
    if (messages.length) {
      const viewport = document.createElement('div');
      viewport.className = 'nav-promo-ticker';
      const track = document.createElement('div');
      track.className = 'nav-promo-track';
      // Build one set of items, then duplicate for a seamless loop.
      const makeItems = () => messages.forEach((li) => {
        const item = document.createElement('span');
        item.className = 'nav-promo-item';
        item.append(...li.cloneNode(true).childNodes);
        track.append(item);
      });
      makeItems();
      makeItems();
      viewport.append(track);
      promo.append(viewport);
      // Pause the scroll on hover for readability.
      viewport.addEventListener('mouseenter', () => { track.style.animationPlayState = 'paused'; });
      viewport.addEventListener('mouseleave', () => { track.style.animationPlayState = 'running'; });
    } else {
      // fallback: whatever the promo section holds
      while (promoSec.firstChild) promo.append(promoSec.firstChild);
    }

    const close = document.createElement('button');
    close.className = 'nav-promo-close';
    close.setAttribute('aria-label', 'Dismiss notification');
    close.innerHTML = '&times;';
    close.addEventListener('click', () => promo.remove());
    promo.append(close);
  }

  // main bar (row 1)
  const bar = document.createElement('div');
  bar.className = 'nav-bar';

  if (brandSec) {
    const brand = document.createElement('div');
    brand.className = 'nav-brand';
    while (brandSec.firstChild) brand.append(brandSec.firstChild);
    bar.append(brand);
  }

  const navMenu = document.createElement('nav');
  navMenu.className = 'nav-menu';
  navMenu.setAttribute('aria-label', 'Main navigation');
  if (menuSec) {
    const list = menuSec.querySelector(':scope > ul');
    if (list) {
      list.classList.add('nav-menu-list');
      list.querySelectorAll(':scope > li').forEach((li) => {
        li.classList.add('nav-menu-item');
        // The markdown->HTML conversion wraps each top-level link in a <p>
        // (li > p > a). The nav CSS and trigger lookup expect the link as a
        // DIRECT child of the li (li > a), so unwrap that leading <p>.
        const leadP = li.querySelector(':scope > p');
        const leadLink = leadP && leadP.querySelector(':scope > a');
        if (leadLink) {
          li.insertBefore(leadLink, leadP);
          leadP.remove();
        }
        const trigger = li.querySelector(':scope > a');
        const hasPanel = !!li.querySelector(':scope > ul');
        if (hasPanel) {
          li.classList.add('nav-has-dropdown');
          decorateDropdown(li);
          if (trigger) {
            trigger.setAttribute('aria-expanded', 'false');
            trigger.setAttribute('aria-haspopup', 'true');
          }
          li.addEventListener('mouseenter', () => {
            if (isDesktop.matches) { closeAll(navMenu); toggleTopItem(li, true); }
          });
          li.addEventListener('mouseleave', () => {
            if (isDesktop.matches) toggleTopItem(li, false);
          });
          if (trigger) {
            trigger.addEventListener('click', (e) => {
              if (!isDesktop.matches) {
                e.preventDefault();
                const open = li.classList.contains('nav-open');
                closeAll(navMenu);
                toggleTopItem(li, !open);
              }
            });
          }
        }
      });
      navMenu.append(list);
    }
  }
  bar.append(navMenu);

  // tools: CTAs + utility icons + hamburger
  const tools = document.createElement('div');
  tools.className = 'nav-tools';

  if (ctaSec) {
    const ctaList = ctaSec.querySelector(':scope > ul');
    if (ctaList) {
      const ctas = [...ctaList.querySelectorAll('a')];
      const ctaWrap = document.createElement('div');
      ctaWrap.className = 'nav-ctas';
      ctas.forEach((a, i) => {
        a.classList.add('button', i === 0 ? 'nav-cta-primary' : 'nav-cta-secondary');
        ctaWrap.append(a);
      });
      tools.append(ctaWrap);
    }
  }

  const icons = document.createElement('div');
  icons.className = 'nav-icons';
  [['phone', 'Call back'], ['search', 'Search'], ['account', 'My account']].forEach(([key, label]) => {
    const b = document.createElement('button');
    b.className = `nav-icon nav-icon-${key}`;
    b.setAttribute('aria-label', label);
    b.innerHTML = ICONS[key];
    icons.append(b);
  });
  tools.append(icons);

  const hamburger = document.createElement('button');
  hamburger.className = 'nav-hamburger';
  hamburger.setAttribute('aria-label', 'Open menu');
  hamburger.setAttribute('aria-expanded', 'false');
  hamburger.innerHTML = '<span></span><span></span><span></span>';
  hamburger.addEventListener('click', () => {
    const open = block.classList.toggle('nav-mobile-open');
    hamburger.setAttribute('aria-expanded', String(open));
    hamburger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.style.overflow = open ? 'hidden' : '';
  });
  tools.append(hamburger);

  bar.append(tools);
  header.append(bar);
  // ticker sits below the nav bar (and above the hero promo), like live
  if (promo) header.append(promo);
  block.append(header);

  // close behaviors
  document.addEventListener('click', (e) => {
    if (isDesktop.matches && !navMenu.contains(e.target)) closeAll(navMenu);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAll(navMenu);
      if (block.classList.contains('nav-mobile-open')) hamburger.click();
    }
  });

  // viewport resize handling
  isDesktop.addEventListener('change', () => {
    closeAll(navMenu);
    block.classList.remove('nav-mobile-open');
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.setAttribute('aria-label', 'Open menu');
    document.body.style.overflow = '';
  });
}

// cache-bust 20260915141455
