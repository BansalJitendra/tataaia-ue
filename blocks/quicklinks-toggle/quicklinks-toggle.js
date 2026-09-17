/*
 * Quick Links Toggle block.
 * Source: .homepagewishlistcomp on tataaia.com — a compact interactive bar that
 * lets a visitor pick a persona ("I am a new customer" / "Existing customer")
 * and then choose an action from a dropdown. New customers see an "I want to"
 * action list; existing customers see a "Help me to" service list. A red arrow
 * navigates to the selected link.
 *
 * Authored structure (two rows, each: label cell + list cell):
 *   - row 1: "I am a new customer" | <ul> of "I want to" links
 *   - row 2: "Existing customer"   | <ul> of "Help me to" links
 * The first row is the default-selected persona.
 */
export default function decorate(block) {
  const rows = [...block.children];
  const personas = rows.map((row) => {
    const cells = [...row.children];
    const label = (cells[0]?.textContent || '').trim();
    const list = cells[1]?.querySelector('ul');
    const links = list ? [...list.querySelectorAll('a')].map((a) => ({
      text: a.textContent.trim(),
      href: a.getAttribute('href'),
    })) : [];
    // The prompt ("I want to" / "Help me to") is authored as the first <p> in
    // the list cell, or falls back to a sensible default.
    const promptEl = cells[1]?.querySelector('p');
    const prompt = promptEl ? promptEl.textContent.trim() : '';
    return { label, prompt, links };
  }).filter((p) => p.links.length);

  block.textContent = '';
  if (!personas.length) return;

  // --- persona toggle ---
  const toggle = document.createElement('div');
  toggle.className = 'quicklinks-toggle-switch';
  const buttons = personas.map((p, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'quicklinks-toggle-option';
    btn.textContent = p.label;
    btn.setAttribute('aria-pressed', String(i === 0));
    toggle.append(btn);
    return btn;
  });
  const knob = document.createElement('span');
  knob.className = 'quicklinks-toggle-knob';
  toggle.insertBefore(knob, buttons[1] || null);

  // --- dropdown selector ---
  const selector = document.createElement('div');
  selector.className = 'quicklinks-toggle-selector';

  const promptLabel = document.createElement('span');
  promptLabel.className = 'quicklinks-toggle-prompt';

  const select = document.createElement('select');
  select.className = 'quicklinks-toggle-select';
  select.setAttribute('aria-label', 'Choose an action');

  const goLink = document.createElement('a');
  goLink.className = 'quicklinks-toggle-go';
  goLink.setAttribute('aria-label', 'Go');
  goLink.innerHTML = '<span class="quicklinks-toggle-arrow"></span>';

  selector.append(promptLabel, select, goLink);

  const renderPersona = (index) => {
    const persona = personas[index];
    promptLabel.textContent = persona.prompt || (index === 0 ? 'I want to' : 'Help me to');
    select.innerHTML = '';
    persona.links.forEach((link, i) => {
      const opt = document.createElement('option');
      opt.value = link.href;
      opt.textContent = link.text;
      if (i === 0) opt.selected = true;
      select.append(opt);
    });
    goLink.href = persona.links[0].href;
    buttons.forEach((b, i) => b.setAttribute('aria-pressed', String(i === index)));
    toggle.dataset.active = index;
  };

  select.addEventListener('change', () => { goLink.href = select.value; });
  buttons.forEach((btn, i) => btn.addEventListener('click', () => renderPersona(i)));

  renderPersona(0);

  // "Know your benefits" CTA — on live this sits to the LEFT of the persona
  // toggle: a small label above a bordered white button (paperwork icon + red
  // arrow) that opens the quote / benefit-illustration tool.
  const benefit = document.createElement('div');
  benefit.className = 'quicklinks-toggle-benefit';
  const benefitLabel = document.createElement('span');
  benefitLabel.className = 'quicklinks-toggle-benefit-label';
  benefitLabel.textContent = 'Know your benefits';
  const benefitLink = document.createElement('a');
  benefitLink.className = 'quicklinks-toggle-benefit-cta';
  benefitLink.href = 'https://siddhi-insurance.tataaia.com/product/quotation/generate-quote?source=WEBSALES&callbackUrl=https://www.tataaia.com/';
  benefitLink.innerHTML = '<img class="quicklinks-toggle-benefit-icon" src="https://www.tataaia.com/content/dam/tataaialifeinsurancecompanylimited/Homepage-Redesign/minimum-paperwork.svg" alt="benefit illustration">'
    + '<span>Quote/Benefit Illustration</span>'
    + '<img class="quicklinks-toggle-benefit-arrow" src="https://www.tataaia.com/content/dam/tataaialifeinsurancecompanylimited/Homepage-Redesign/Right-Arrow-red.svg" alt="right arrow">';
  benefit.append(benefitLabel, benefitLink);

  // Group the persona toggle + action dropdown so the benefit CTA can sit
  // beside them (benefit on the left, toggle group on the right — like live).
  const main = document.createElement('div');
  main.className = 'quicklinks-toggle-main';
  main.append(toggle, selector);

  block.append(benefit, main);
}
