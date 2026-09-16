/* eslint-disable */
/* global WebImporter */

/**
 * Parser for columns-product-recom variant. Base: columns.
 * Source: Tata AIA homepage — .product-recom-banner ("Can't decide on a term
 * insurance plan?" callout under the Life Insurance intro).
 * Model: the core columns component — one row, three free-content columns:
 *   - col 1: the left illustration image
 *   - col 2: pitch heading, subtext, check-mark bullets, fine print
 *   - col 3: best-seller line, plan name, price, details, benefit list, CTA link
 * The block name starts with "Columns" so md2jcr routes it through the columns
 * component (which maps mixed multi-column content generically).
 *
 * The live section is a conditionally-rendered banner whose DOM is not reliably
 * populated at import time, so the (stable) copy is authored here. Images use
 * the source CDN, consistent with the rest of the migrated homepage.
 */
const DAM = 'https://www.tataaia.com/content/dam/tataaialifeinsurancecompanylimited';
const BANNER_IMG = `${DAM}/hard-code-icons/Product-Recommendation/Banner_Image.png`;

export default function parse(element, { document }) {
  const h = (html) => {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content;
  };

  // Col 1: left illustration.
  const imageFrag = document.createDocumentFragment();
  const img = document.createElement('img');
  img.setAttribute('src', BANNER_IMG);
  img.setAttribute('alt', 'Family protected by Tata AIA term insurance');
  const imgP = document.createElement('p');
  imgP.appendChild(img);
  imageFrag.appendChild(imgP);

  // Col 2: left pitch copy.
  const leftFrag = document.createDocumentFragment();
  leftFrag.appendChild(h(`
    <h2>Can't decide on a term insurance plan?</h2>
    <p>Share your needs and get</p>
    <ul>
      <li>Personalized suggestions</li>
      <li>Customizable quotes</li>
    </ul>
    <p>Non-Linked, Non-Participating, pure risk, Individual Life Insurance Product (UIN:110N176V11)</p>
  `));

  // Col 3: right plan card.
  const rightFrag = document.createDocumentFragment();
  rightFrag.appendChild(h(`
    <p>Best Seller</p>
    <h3>Tata AIA Sampoorna Raksha Promise</h3>
    <p>Get ₹1 Crore Life cover @ ₹826/month</p>
    <p>Age: 25 | Cover till age: 60 yrs | Payment duration: 35 yrs</p>
    <ul>
      <li>99.45% Individual Death Claim Settlement Ratio</li>
      <li>Pay later option — Defer premium by 12 months</li>
      <li>Instant Payout on terminal illness</li>
    </ul>
    <p><a href="/life-insurance-plans/term-insurance/sampoorna-raksha-promise.html?utm_campaign=homepage_productrecom">Customize plans for you</a></p>
  `));

  const cells = [[imageFrag, leftFrag, rightFrag]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-product-recom', cells });
  element.replaceWith(block);
}
