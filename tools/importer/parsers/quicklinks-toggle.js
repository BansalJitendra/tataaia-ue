/* eslint-disable */
/* global WebImporter */

/**
 * Parser for quicklinks-toggle variant. Base: cards (container).
 * Source: Tata AIA homepage — .homepagewishlistcomp (an interactive persona
 * toggle bar: "I am a new customer" / "Existing customer", each with a labelled
 * dropdown of action links).
 * Model: CONTAINER block (filter: quicklinks-toggle) with repeating
 *   quicklinks-toggle-item rows. Each row has two cells:
 *     - label (text)   — the persona label
 *     - links (richtext) — a prompt <p> ("I want to" / "Help me to") + a <ul>
 * The new-customer persona is emitted first (it is the default-selected toggle).
 */
export default function parse(element, { document }) {
  // The widget holds two link lists; classify each by its nearby prompt text.
  const lists = Array.from(element.querySelectorAll('ul'));

  const findPrompt = (ul) => {
    // Look for an "I want to" / "Help me to" label near the list.
    const scope = ul.closest('[class*="dropdown"], [class*="wishlist"]') || element;
    const label = Array.from(scope.querySelectorAll('*'))
      .find((e) => e.children.length === 0 && /^(i want to|help me to)$/i.test(e.textContent.trim()));
    if (label) return label.textContent.trim();
    // fallback by first item
    const first = (ul.querySelector('a')?.textContent || '').toLowerCase();
    return /buy|save|invest/.test(first) ? 'I want to' : 'Help me to';
  };

  const buildRow = (personaLabel, prompt, ul) => {
    const labelFrag = document.createDocumentFragment();
    labelFrag.appendChild(document.createComment(' field:label '));
    labelFrag.appendChild(document.createTextNode(personaLabel));

    const linksFrag = document.createDocumentFragment();
    linksFrag.appendChild(document.createComment(' field:links '));
    const p = document.createElement('p');
    p.textContent = prompt;
    linksFrag.appendChild(p);
    linksFrag.appendChild(ul.cloneNode(true));

    return [labelFrag, linksFrag];
  };

  // Map each list to {prompt, ul}, then order new-customer first.
  const mapped = lists.map((ul) => ({ prompt: findPrompt(ul), ul }))
    .filter((m) => m.ul.querySelector('a'));

  const wantList = mapped.find((m) => /want/i.test(m.prompt));
  const helpList = mapped.find((m) => /help/i.test(m.prompt));

  const cells = [];
  if (wantList) cells.push(buildRow('I am a new customer', wantList.prompt || 'I want to', wantList.ul));
  if (helpList) cells.push(buildRow('Existing customer', helpList.prompt || 'Help me to', helpList.ul));
  // fallback: if classification failed, emit whatever lists exist
  if (!cells.length) {
    mapped.forEach((m, i) => {
      cells.push(buildRow(i === 0 ? 'I am a new customer' : 'Existing customer', m.prompt, m.ul));
    });
  }

  if (!cells.length) {
    element.remove();
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'quicklinks-toggle', cells });
  element.replaceWith(block);
}
