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
  // Accessibility icon (own-origin SVG copied from live).
  accessibility: '<img class="nav-icon-img" src="/icons/nav-accessibility.svg" alt="" width="24" height="24" loading="lazy">',
  search: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
  account: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
};

// ---- Header utility popups ----------------------------------------------
// Each header icon (phone / search / account / accessibility / more) opens a
// popup panel with content related to that icon, matching live. Content is
// static (mirrors live copy/links); the search box links to relevant pages
// rather than a live backend.

const POPUP_HTML = {
  phone: `
    <h3 class="nav-popup-title">Call us</h3>
    <div class="nav-callus-group">
      <p class="nav-callus-head">For existing policy</p>
      <p>Have query on premium, payout or any servicing need?</p>
      <p>Call us: <a href="tel:18602669966">1860 266 9966</a></p>
      <p>Dedicated NRI Helpdesk: <a href="tel:+912262519966">+91 22 6251 9966</a></p>
      <p class="nav-callus-time">Monday – Saturday | 10 am – 7 pm IST · Call charges apply</p>
    </div>
    <div class="nav-callus-group">
      <p class="nav-callus-head">For new policy</p>
      <p>For Indian Residents <a href="tel:+912269849300">+91 22 6984 9300</a></p>
      <p class="nav-callus-time">All Days | 8 am – 11 pm IST</p>
      <p>Give missed call for a call back: <a href="tel:+911166158748">+91 11 6615 8748</a></p>
      <p class="nav-callus-time">All Days | 9 am – 9 pm IST</p>
    </div>
    <div class="nav-callus-group">
      <p class="nav-callus-head">For new policy (NRIs)</p>
      <p>Give missed call for a call back: <a href="tel:+911169216464">+91 11 6921 6464</a></p>
      <p class="nav-callus-time">Available All Days | 24 x 7</p>
    </div>`,
  search: `
    <h3 class="nav-popup-title">Search</h3>
    <form class="nav-search-form" role="search" action="/search.html" method="get">
      <input type="search" name="q" class="nav-search-input" placeholder="Search for plans, calculators, services…" aria-label="Search">
      <button type="submit" class="nav-search-submit" aria-label="Search">Search</button>
    </form>
    <p class="nav-popup-subhead">Popular searches</p>
    <ul class="nav-popup-links">
      <li><a href="/calculator/term-insurance-calculator.html">Calculate Term Premium</a></li>
      <li><a href="https://myinsurance.tataaia.com/portfolio/login?target=50">Pay Premium</a></li>
      <li><a href="/customer-service/claims.html">Register a claim</a></li>
      <li><a href="/customer-service/life-insurance-dividend-and-bonus-rates.html">Bonus &amp; Dividend</a></li>
      <li><a href="/customer-service/download-centre.html">Download Policy Document</a></li>
      <li><a href="/customer-service.html">Submit a Complaint</a></li>
    </ul>`,
  account: `
    <h3 class="nav-popup-title">Login</h3>
    <ul class="nav-popup-links">
      <li><a href="https://myinsurance.tataaia.com/">Customer login</a></li>
      <li><a href="https://grip.tataaia.com/TVG/">Corporate login</a></li>
      <li><a href="https://www.italic.co.in/wps/portal/italic/login">Distributor login</a></li>
      <li><a href="https://sellonline.tataaia.com/">Sell Online</a></li>
    </ul>`,
  more: `
    <h3 class="nav-popup-title">More</h3>
    <div class="nav-more-cols">
      <div class="nav-more-col">
        <p class="nav-popup-subhead">Calculators</p>
        <ul class="nav-popup-links">
          <li><a href="/calculator/term-insurance-calculator.html">Term Insurance Calculator</a></li>
          <li><a href="/calculator/ulip-calculator.html">ULIP Calculator</a></li>
          <li><a href="/calculator/saving-calculator.html">Savings Calculator</a></li>
          <li><a href="/calculator/retirement-and-pension-calculator.html">Retirement &amp; Pension Calculator</a></li>
          <li><a href="/calculator/compound-interest-calculator.html">Compound Interest Calculator</a></li>
          <li><a href="/calculator/human-life-value-calculator.html">Human Life Value Calculator</a></li>
        </ul>
      </div>
      <div class="nav-more-col">
        <p class="nav-popup-subhead">Fund Performance</p>
        <ul class="nav-popup-links">
          <li><a href="/investment-funds/tata-aia-fund-performance.html">All Tata AIA Funds</a></li>
          <li><a href="/customer-service/fact-sheet.html">View Fund Fact Sheet</a></li>
          <li><a href="/customer-service/life-insurance-dividend-and-bonus-rates.html">Bonus &amp; Dividend Performance</a></li>
          <li><a href="/investment-funds/nfo.html">Tata AIA New Fund Offers (NFO)</a></li>
        </ul>
      </div>
      <div class="nav-more-col">
        <p class="nav-popup-subhead">Trending Topics</p>
        <ul class="nav-popup-links">
          <li><a href="/life-insurance-plans/term-insurance/compare-term-insurance-plans.html">Compare Term Plans</a></li>
          <li><a href="/life-insurance-plans/nri-life-insurance-plans.html">NRI Life Insurance</a></li>
          <li><a href="/life-insurance-plans/term-insurance/2-crore-term-insurance.html">2 Crore Term Insurance</a></li>
          <li><a href="/life-insurance-plans/savings-solutions/endowment-policy.html">Endowment Policy</a></li>
        </ul>
      </div>
    </div>`,
};

// Accessibility panel: functional client-side controls (text size, contrast,
// grayscale, highlight links, readable font) applied to <html> data-attrs.
const A11Y_HTML = `
  <h3 class="nav-popup-title">Accessibility</h3>
  <div class="nav-a11y-controls">
    <button type="button" data-a11y="textsize">Bigger Text</button>
    <button type="button" data-a11y="contrast">High Contrast</button>
    <button type="button" data-a11y="grayscale">Grayscale</button>
    <button type="button" data-a11y="links">Highlight Links</button>
    <button type="button" data-a11y="readable">Readable Font</button>
    <button type="button" data-a11y="reset" class="nav-a11y-reset">Reset</button>
  </div>`;

function applyA11y(mode) {
  const root = document.documentElement;
  if (mode === 'reset') {
    ['textsize', 'contrast', 'grayscale', 'links', 'readable'].forEach((m) => root.removeAttribute(`data-a11y-${m}`));
    return;
  }
  const attr = `data-a11y-${mode}`;
  if (root.hasAttribute(attr)) root.removeAttribute(attr);
  else root.setAttribute(attr, 'on');
}

/** Build one popup panel element for a given icon key. */
function buildPopup(key) {
  const popup = document.createElement('div');
  popup.className = `nav-popup nav-popup-${key}`;
  popup.setAttribute('hidden', '');
  popup.innerHTML = (key === 'accessibility' ? A11Y_HTML : POPUP_HTML[key]) || '';
  if (key === 'accessibility') {
    popup.querySelectorAll('[data-a11y]').forEach((btn) => {
      btn.addEventListener('click', () => applyA11y(btn.dataset.a11y));
    });
  }
  return popup;
}

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

  // Each utility icon opens a popup panel (like live). The panels are appended
  // to the tools group and toggled on click; opening one closes the others.
  const popups = [];
  const closeAllPopups = (except) => {
    popups.forEach((p) => { if (p !== except) p.setAttribute('hidden', ''); });
  };
  const wirePopup = (trigger, popup) => {
    popups.push(popup);
    trigger.setAttribute('aria-haspopup', 'true');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = !popup.hasAttribute('hidden');
      closeAllPopups(popup);
      if (isOpen) popup.setAttribute('hidden', '');
      else popup.removeAttribute('hidden');
      trigger.setAttribute('aria-expanded', String(!isOpen));
    });
    popup.addEventListener('click', (e) => e.stopPropagation());
  };

  const icons = document.createElement('div');
  icons.className = 'nav-icons';
  [['phone', 'Call back'], ['search', 'Search'], ['account', 'My account'], ['accessibility', 'Accessibility']].forEach(([key, label]) => {
    const wrap = document.createElement('div');
    wrap.className = `nav-icon-wrap nav-icon-wrap-${key}`;
    const b = document.createElement('button');
    b.className = `nav-icon nav-icon-${key}`;
    b.setAttribute('aria-label', label);
    b.innerHTML = ICONS[key];
    wrap.append(b);
    const popup = buildPopup(key);
    wrap.append(popup);
    wirePopup(b, popup);
    icons.append(wrap);
  });
  tools.append(icons);

  // Hamburger ("More"): on desktop it opens the More popup; on mobile it opens
  // the slide-in drawer.
  const hamburgerWrap = document.createElement('div');
  hamburgerWrap.className = 'nav-icon-wrap nav-icon-wrap-more';
  const hamburger = document.createElement('button');
  hamburger.className = 'nav-hamburger';
  hamburger.setAttribute('aria-label', 'Open menu');
  hamburger.setAttribute('aria-expanded', 'false');
  hamburger.innerHTML = '<span></span><span></span><span></span>';
  const morePopup = buildPopup('more');
  hamburgerWrap.append(hamburger, morePopup);
  popups.push(morePopup);
  hamburger.addEventListener('click', (e) => {
    if (isDesktop.matches) {
      e.stopPropagation();
      const isOpen = !morePopup.hasAttribute('hidden');
      closeAllPopups(morePopup);
      if (isOpen) morePopup.setAttribute('hidden', '');
      else morePopup.removeAttribute('hidden');
      hamburger.setAttribute('aria-expanded', String(!isOpen));
      return;
    }
    const open = block.classList.toggle('nav-mobile-open');
    hamburger.setAttribute('aria-expanded', String(open));
    hamburger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.style.overflow = open ? 'hidden' : '';
  });
  morePopup.addEventListener('click', (e) => e.stopPropagation());
  tools.append(hamburgerWrap);

  // Close any open popup when clicking outside or pressing Escape.
  document.addEventListener('click', () => closeAllPopups(null));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAllPopups(null); });

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
