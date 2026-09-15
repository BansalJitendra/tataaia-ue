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
      // Non-authorable leftover elements
      'link',
      'noscript',
      'iframe',
      'style',
    ]);

    // Strip AEM/analytics runtime attributes left on content nodes so the
    // import output stays clean and authorable.
    element.querySelectorAll('[data-cmp-data-layer], [data-analytics], [onclick]').forEach((el) => {
      el.removeAttribute('data-cmp-data-layer');
      el.removeAttribute('data-analytics');
      el.removeAttribute('onclick');
    });
  }
}
