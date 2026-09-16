/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Tata AIA site-wide cleanup.
 *
 * Removes non-authorable site chrome (header/nav, footer, global overlays,
 * popups) and AEM runtime/analytics artifacts so the import contains only
 * page-level authorable content.
 *
 * ALL selectors below were verified by reading migration-work/cleaned.html
 * (line references in comments). No selectors are guessed.
 */

const TransformHook = {
  beforeTransform: 'beforeTransform',
  afterTransform: 'afterTransform',
};

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    WebImporter.DOMUtils.remove(element, [
      // Top-of-body hidden runtime inputs (cleaned.html L2, L4, L6)
      '#otp_require',
      '#payment_otp',
      '#page-path',
      // Adobe ID syncing iframe injected in body (cleaned.html L9)
      '#destination_publishing_iframe_talic_0',
      // Global call/VOIP overlays + popups (cleaned.html L2287, L2290, L2401)
      '.call-us-ta-overlay',
      '.new-call-us-wrapper',
      '.voip-popup-section',
      // Nav search overlay / modal (cleaned.html L3364)
      '.nav-revamp-search-overlay',
      // Screen-reader accessibility popup (cleaned.html L3747)
      '.screen-reader-popup',
      // OTP popups injected near forms (cleaned.html L8791, L9950, ...)
      '.new-otp-popup-section',

      // --- Product-recommendation calculator + its popup/loader/failure states ---
      // These hidden feature containers live between the first and second
      // `.term-insurance-maininfo-container` (Life Insurance intro → Types of Life
      // Insurance). On the live page they are all display:none popups/loaders, but
      // they serialized into the import as visible default content trailing the first
      // columns-panels block (OTP verify, "Almost there" loader, API-failure states,
      // "Can't decide" teaser, product-recom banners). All selectors verified to occur
      // ONLY after hero-promo and before the FAQ accordion — never in visible content.
      '.product-recommendation-calcuator',
      '.productrecommendation-cal',
      '.production-recommendation-api',
      '.product-recom-form-section',
      '.newcampaignloader',
      '.page-loader-wrapper',
      '.api-failure-page',
      '.vymoapifailuremessage-page',
      '.vymo-api-failure-wrapper',
      '.otp-popup',
      '.new-otp-popup-overlay',
      '.trs-new-otp-popup-overlay',
      '.otppopup-failpopup-wrapper',
      '.otpfailpopup',
      '.need-info-cc-popup-wrapper',
      '.in-fo-search-popup',
      '.ta-modal-wrap',

      // --- Header / navigation chrome (removed BEFORE block parsing) ---
      // The desktop header XF (cleaned.html L35) and the mobile navigation
      // experience fragments live in SEPARATE containers that are NOT nested
      // inside `.new-header` (note the shallower indentation of the mobile XF
      // wrappers at L4158/L7013 vs `.new-header` at L35). Removing `.new-header`
      // alone in afterTransform therefore left ~59KB of mobile nav/menu markup
      // (255 `new-navigation-icon` nodes) serialized as default content before
      // the hero-promo block. All the selectors below were verified to occur
      // ONLY before the first authorable block (hero-promo, cleaned.html L7322)
      // and never in body or footer content.
      //
      // Global desktop header / nav experience fragment (cleaned.html L35)
      '.new-header',
      // Mobile + desktop nav menu containers (cleaned.html L56, L58, L162, ...)
      '.newheadercontainer',
      // Mobile sub-navigation panels (cleaned.html L4164, L7018, ...)
      '.mob-sub-navigation',
      // Desktop main-menu click wrappers (cleaned.html L58, L178, L309, ...)
      '.main-header-click',
      // Mobile hamburger menu wrapper (cleaned.html L3793)
      '.navmenuhumberg',
      // Mobile nav experience-fragment wrappers (cleaned.html L4159, L4351, ...)
      '[class*="cmp-experiencefragment--mob-"]',
      // Hamburger nav experience fragment (cleaned.html L3790)
      '.cmp-experiencefragment--Nav-Hamburger-xf',
      // Mobile social-media strip inside nav (cleaned.html L7254)
      '.mob-social-media-sec-wrap',
    ]);
  }

  if (hookName === TransformHook.afterTransform) {
    WebImporter.DOMUtils.remove(element, [
      // Global footer (cleaned.html L21153)
      '.footer',
      // Sticky mobile footer quick-options bar (cleaned.html L21229, L21237)
      '.ta-thunder-btn-w',
      '.footerSticky',
      // Sticky footer promo banner (cleaned.html L22275)
      '.aia-footer-banner',
      // Runtime analytics / positioning hidden inputs inside content blocks
      // (cleaned.html L7315, L7553)
      '.bannerPosition',
      '.ccBannerAnalyticsData',

      // --- Post-footer widget chrome (hidden on the live page) ---
      // These sit after the footer in source and rendered into the import as a
      // trailing default-content block (chatbot avatar, sticky "Calculate Term
      // Premium" button, loader gif, on-screen keyboard, date-picker calendar).
      // None are visible on the live page.
      '.chatbot-wrapper',
      '.chatbot-redirect',
      '.calc-premium-btn-wrap',
      '.ta-loader',
      '.keyboardWrapper',
      '[class*="keyboardWrapper"]',
      '[class*="virtual-keyboard"]',
      '[class*="datepicker-calendar"]',
      '[class*="ta-datepicker-cal"]',

      // Non-authorable leftover elements
      'link',
      'noscript',
      'iframe',
      'style',
    ]);

    // The on-screen keyboard and date-picker calendar are injected by runtime JS
    // into class-less wrappers at the end of <body>, so no stable selector matches.
    // Remove any leftover top-level block whose text is only keypad/calendar glyphs
    // (e.g. "QWERTYUIOP", "January, 2000" day grids) plus tracking pixels.
    const KEYBOARD_RE = /QWERTYUIOP|ASDFGHJKL|ZXCVBNM/;
    const WEEKDAYS_RE = /Su.?Mo.?Tu.?We.?Th.?Fr.?Sa/;
    // Remove the on-screen keyboard and date-picker calendar. Their glyphs may be
    // split across sibling <p>s, so match on the enclosing container's text and
    // remove the whole container (not just the inner element).
    const junkHosts = new Set();
    element.querySelectorAll('div, p, ul').forEach((el) => {
      const text = (el.textContent || '').replace(/\s+/g, '');
      if (KEYBOARD_RE.test(text) || WEEKDAYS_RE.test(text)) {
        // climb to the outermost ancestor that is still "only" this junk
        let host = el;
        while (host.parentElement
          && host.parentElement !== element
          && (host.parentElement.textContent || '').replace(/\s+/g, '') === text) {
          host = host.parentElement;
        }
        junkHosts.add(host);
      }
    });
    junkHosts.forEach((el) => { if (el.parentNode) el.remove(); });
    // Lemnisk / third-party tracking pixels left inline.
    element.querySelectorAll('img[src*="lemnisk"]').forEach((img) => {
      const p = img.closest('p');
      (p || img).remove();
    });

    // Strip AEM/analytics runtime attributes left on content nodes so the
    // import output stays clean and authorable.
    element.querySelectorAll('[data-cmp-data-layer], [data-analytics], [onclick]').forEach((el) => {
      el.removeAttribute('data-cmp-data-layer');
      el.removeAttribute('data-analytics');
      el.removeAttribute('onclick');
    });
  }
}
