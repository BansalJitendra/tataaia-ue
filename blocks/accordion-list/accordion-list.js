/*
 * Accordion List Block
 * Expandable title/content item list.
 */

import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  const rows = [...block.children];

  // The "Disclaimers" accordion renders plain on live — a single large-title
  // expandable header with no card background/border (unlike the blue-tinted
  // card accordions used for Types of Life Insurance / FAQs). Flag it so the CSS
  // can drop the card treatment.
  const firstLabel = rows[0]?.children[0]?.textContent.trim() || '';
  if (rows.length === 1
    && /^(Disclaimers|Know about Life Insurance|Frequently Asked Questions.*)$/i.test(firstLabel)) {
    block.classList.add('accordion-list-plain');
  }

  rows.forEach((row) => {
    // decorate accordion item label
    const label = row.children[0];
    const summary = document.createElement('summary');
    summary.className = 'accordion-list-item-label';
    summary.append(...label.childNodes);
    // decorate accordion item body
    const body = row.children[1];
    body.className = 'accordion-list-item-body';
    // "Types of Life Insurance" items end with a CTA paragraph holding a
    // "Calculate Premium" and/or "Know More About ..." link. On live these
    // render as buttons — flag the paragraph + links so the CSS can style them.
    body.querySelectorAll('p').forEach((p) => {
      const links = [...p.querySelectorAll(':scope > a')];
      const ctaRe = /^(Calculate\b|Know More About)/i;
      const ctaLinks = links.filter((a) => ctaRe.test(a.textContent.trim()));
      // only when the paragraph is essentially just CTA links
      if (ctaLinks.length && ctaLinks.length === links.length
        && p.textContent.trim() === links.map((a) => a.textContent.trim()).join(' ')) {
        p.classList.add('accordion-list-cta-row');
        ctaLinks.forEach((a) => {
          a.classList.add('accordion-list-cta');
          if (/^Calculate\b/i.test(a.textContent.trim())) {
            a.classList.add('accordion-list-cta-primary');
          } else {
            a.classList.add('accordion-list-cta-secondary');
          }
        });
      }
    });
    // decorate accordion item
    const details = document.createElement('details');
    moveInstrumentation(row, details);
    details.className = 'accordion-list-item';
    details.append(summary, body);
    row.replaceWith(details);
  });
}
