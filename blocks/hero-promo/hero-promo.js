import { moveInstrumentation } from '../../scripts/scripts.js';
import { fetchPlaceholders } from '../../scripts/placeholders.js';

/*
 * Hero Promo block — full-bleed promotional hero CAROUSEL.
 * Source: .homepage-banner-slider-container on tataaia.com (a swiper of promo
 * banners at the top of the homepage). Each slide is a background image with
 * foreground content layered on top: an eyebrow line, a large heading, a row of
 * badge "chips", optional fine print, and a primary CTA button.
 *
 * Authored structure (container + repeating item):
 *   - each row (item) has two cells: an image cell (media_image) and a richtext
 *     cell (content_text) holding the eyebrow, heading, chip <p>s, fine print
 *     and the <p><a> CTA (in that order).
 * Slides auto-rotate and can be navigated via dots / prev-next controls.
 */

function classifyContent(textCell) {
  // Build the foreground content container from a slide's richtext cell,
  // classifying paragraphs into eyebrow / heading / chips / fine print / CTA.
  const content = document.createElement('div');
  content.className = 'hero-promo-content';
  const badges = document.createElement('div');
  badges.className = 'hero-promo-badges';

  const nodes = [...textCell.children];
  // `mainIdx` tracks the primary copy lines (eyebrow, heading, chips) so the
  // classification isn't thrown off by a leading disclaimer line.
  let mainIdx = 0;
  let fineprint = null;
  nodes.forEach((node, i) => {
    const hasLink = node.querySelector && node.querySelector('a');
    const text = node.textContent.trim();
    if (hasLink) {
      const link = node.querySelector('a');
      link.classList.add('button');
      const container = document.createElement('p');
      container.className = 'button-container';
      container.append(link);
      content.append(container);
    } else if (i === 0 && text.length > 60) {
      // A long first line is the policyholder risk disclaimer — small text
      // pinned above the eyebrow/heading (as on live), not the eyebrow itself.
      node.classList.add('hero-promo-disclaimer');
      content.append(node);
    } else if (text.length > 120) {
      // Long legal fine print — small text pinned to the bottom of the overlay.
      node.classList.add('hero-promo-fineprint');
      fineprint = node;
    } else if (mainIdx === 0) {
      node.classList.add('hero-promo-eyebrow');
      content.append(node);
      mainIdx += 1;
    } else if (mainIdx === 1) {
      const h = document.createElement('h2');
      h.className = 'hero-promo-heading';
      h.innerHTML = node.innerHTML;
      content.append(h);
      mainIdx += 1;
    } else if (text) {
      node.classList.add('hero-promo-chip');
      badges.append(node);
      mainIdx += 1;
    }
  });

  if (badges.children.length) {
    const heading = content.querySelector('.hero-promo-heading');
    if (heading) heading.after(badges);
    else content.prepend(badges);
  }
  // Append the legal fine print last so it sits below the CTA at the bottom.
  if (fineprint) content.append(fineprint);
  return content;
}

function updateActiveSlide(slide) {
  const block = slide.closest('.hero-promo');
  const slideIndex = parseInt(slide.dataset.slideIndex, 10);
  block.dataset.activeSlide = slideIndex;

  const slides = block.querySelectorAll('.hero-promo-slide');
  slides.forEach((aSlide, idx) => {
    aSlide.setAttribute('aria-hidden', idx !== slideIndex);
    aSlide.querySelectorAll('a').forEach((link) => {
      if (idx !== slideIndex) link.setAttribute('tabindex', '-1');
      else link.removeAttribute('tabindex');
    });
  });

  const indicators = block.querySelectorAll('.hero-promo-slide-indicator');
  indicators.forEach((indicator, idx) => {
    if (idx !== slideIndex) indicator.querySelector('button').removeAttribute('disabled');
    else indicator.querySelector('button').setAttribute('disabled', 'true');
  });
}

function showSlide(block, slideIndex = 0, behavior = 'smooth') {
  const slides = block.querySelectorAll('.hero-promo-slide');
  let realSlideIndex = slideIndex < 0 ? slides.length - 1 : slideIndex;
  if (slideIndex >= slides.length) realSlideIndex = 0;
  const activeSlide = slides[realSlideIndex];

  activeSlide.querySelectorAll('a').forEach((link) => link.removeAttribute('tabindex'));
  block.querySelector('.hero-promo-slides').scrollTo({
    top: 0,
    left: activeSlide.offsetLeft,
    behavior,
  });
}

function bindEvents(block) {
  const slideIndicators = block.querySelector('.hero-promo-slide-indicators');
  if (slideIndicators) {
    slideIndicators.querySelectorAll('button').forEach((button) => {
      button.addEventListener('click', (e) => {
        const slideIndicator = e.currentTarget.parentElement;
        showSlide(block, parseInt(slideIndicator.dataset.targetSlide, 10));
      });
    });
  }

  const prev = block.querySelector('.slide-prev');
  const next = block.querySelector('.slide-next');
  if (prev) prev.addEventListener('click', () => showSlide(block, parseInt(block.dataset.activeSlide, 10) - 1));
  if (next) next.addEventListener('click', () => showSlide(block, parseInt(block.dataset.activeSlide, 10) + 1));

  const slideObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) updateActiveSlide(entry.target);
    });
  }, { threshold: 0.5 });
  block.querySelectorAll('.hero-promo-slide').forEach((slide) => slideObserver.observe(slide));
}

// Auto-rotate through the banners; pause on hover / when the tab is hidden.
function autoRotate(block) {
  const slides = block.querySelectorAll('.hero-promo-slide');
  if (slides.length < 2) return;
  const INTERVAL = 5000;
  let timer = null;
  const advance = () => {
    const current = parseInt(block.dataset.activeSlide || '0', 10);
    showSlide(block, current + 1);
  };
  const start = () => { if (!timer) timer = window.setInterval(advance, INTERVAL); };
  const stop = () => { if (timer) { window.clearInterval(timer); timer = null; } };
  block.addEventListener('mouseenter', stop);
  block.addEventListener('mouseleave', start);
  block.addEventListener('focusin', stop);
  block.addEventListener('focusout', start);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  start();
}

function createSlide(row, slideIndex) {
  const slide = document.createElement('li');
  slide.dataset.slideIndex = slideIndex;
  slide.classList.add('hero-promo-slide');

  const cols = [...row.querySelectorAll(':scope > div')];
  const imageCol = cols.find((c) => c.querySelector('picture, img'));
  const textCol = cols.find((c) => c !== imageCol);

  // Background image layer.
  if (imageCol) {
    const bg = document.createElement('div');
    bg.className = 'hero-promo-bg';
    const pic = imageCol.querySelector('picture') || imageCol.querySelector('img');
    if (pic) {
      // The first slide's image is the LCP element — load it eagerly with high
      // priority instead of lazily so LCP isn't delayed.
      const img = pic.querySelector ? pic.querySelector('img') : null;
      if (slideIndex === 0 && img) {
        img.setAttribute('loading', 'eager');
        img.setAttribute('fetchpriority', 'high');
      }
      bg.append(pic);
    }
    slide.append(bg);
  }

  // Foreground content layer.
  if (textCol) slide.append(classifyContent(textCol));

  return slide;
}

let heroPromoId = 0;
export default async function decorate(block) {
  heroPromoId += 1;
  block.setAttribute('id', `hero-promo-${heroPromoId}`);
  const rows = [...block.querySelectorAll(':scope > div')];
  const isSingleSlide = rows.length < 2;

  const placeholders = await fetchPlaceholders();
  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', placeholders.carousel || 'Carousel');

  const container = document.createElement('div');
  container.classList.add('hero-promo-slides-container');

  const slidesWrapper = document.createElement('ul');
  slidesWrapper.classList.add('hero-promo-slides');

  let slideIndicators;
  if (!isSingleSlide) {
    const slideIndicatorsNav = document.createElement('nav');
    slideIndicatorsNav.setAttribute('aria-label', placeholders.carouselSlideControls || 'Carousel Slide Controls');
    slideIndicators = document.createElement('ol');
    slideIndicators.classList.add('hero-promo-slide-indicators');
    slideIndicatorsNav.append(slideIndicators);

    // Live has no prev/next arrows on the hero-promo carousel — only the dot
    // indicators. Omit the navigation arrow buttons to match live.
    container.append(slideIndicatorsNav);
  }

  rows.forEach((row, idx) => {
    const slide = createSlide(row, idx);
    moveInstrumentation(row, slide);
    slidesWrapper.append(slide);

    if (slideIndicators) {
      const indicator = document.createElement('li');
      indicator.classList.add('hero-promo-slide-indicator');
      indicator.dataset.targetSlide = idx;
      indicator.innerHTML = `<button type="button" aria-label="${placeholders.showSlide || 'Show Slide'} ${idx + 1} ${placeholders.of || 'of'} ${rows.length}"></button>`;
      slideIndicators.append(indicator);
    }
    row.remove();
  });

  container.prepend(slidesWrapper);
  block.append(container);

  if (!isSingleSlide) {
    bindEvents(block);
    autoRotate(block);
  }
}
