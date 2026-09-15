/* eslint-disable */
/* global WebImporter */

/**
 * Parser for tabs-links variant. Base: tabs.
 * Source: Tata AIA homepage — .popular-searches-section
 * Model: container with tabs-links-item children (2 columns per row: title cell, content cell).
 *   Item fields: title (text), content_heading (text), content_headingType (collapsed/skipped),
 *     content_image (reference), content_richtext (richtext).
 *   Grouped: content_* fields share the second cell; title is the first cell.
 * The source is a single "Popular Searches" grouping: a section heading plus a list of link
 * buttons. It is represented as one tab whose title is the heading and whose content is the links.
 */
export default function parse(element, { document }) {
  const heading = element.querySelector('.popular-searches-heading h2, h2, h3');
  const title = heading ? heading.textContent.trim() : 'Popular Searches';

  // Collect the link buttons (each teaser holds a single anchor)
  const anchors = Array.from(element.querySelectorAll('.popular-searches-btns a[href], .cmp-teaser__description a[href]'))
    .filter((a) => a.textContent.trim());

  const cells = [];

  // Column 1: title field (tab label)
  const titleFrag = document.createDocumentFragment();
  titleFrag.appendChild(document.createComment(' field:title '));
  titleFrag.appendChild(document.createTextNode(title));

  // Column 2: grouped content_* — content_richtext holds the list of popular-search links
  const contentFrag = document.createDocumentFragment();
  contentFrag.appendChild(document.createComment(' field:content_richtext '));
  const list = document.createElement('ul');
  anchors.forEach((a) => {
    const li = document.createElement('li');
    const link = document.createElement('a');
    link.setAttribute('href', a.getAttribute('href'));
    link.textContent = a.textContent.trim();
    li.appendChild(link);
    list.appendChild(li);
  });
  if (list.childNodes.length) contentFrag.appendChild(list);

  cells.push([titleFrag, contentFrag]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'tabs-links', cells });
  element.replaceWith(block);
}
