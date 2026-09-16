import createField from './form-fields.js';

async function createForm(formHref, submitHref) {
  const { pathname } = new URL(formHref);
  const resp = await fetch(pathname);
  const json = await resp.json();

  const form = document.createElement('form');
  form.dataset.action = submitHref;

  const fields = await Promise.all(json.data.map((fd) => createField(fd, form)));
  fields.forEach((field) => {
    if (field) {
      form.append(field);
    }
  });

  // group fields into fieldsets
  const fieldsets = form.querySelectorAll('fieldset');
  fieldsets.forEach((fieldset) => {
    form.querySelectorAll(`[data-fieldset="${fieldset.name}"`).forEach((field) => {
      fieldset.append(field);
    });
  });

  return form;
}

function generatePayload(form) {
  const payload = {};

  [...form.elements].forEach((field) => {
    if (field.name && field.type !== 'submit' && !field.disabled) {
      if (field.type === 'radio') {
        if (field.checked) payload[field.name] = field.value;
      } else if (field.type === 'checkbox') {
        if (field.checked) payload[field.name] = payload[field.name] ? `${payload[field.name]},${field.value}` : field.value;
      } else {
        payload[field.name] = field.value;
      }
    }
  });
  return payload;
}

async function handleSubmit(form) {
  if (form.getAttribute('data-submitting') === 'true') return;

  const submit = form.querySelector('button[type="submit"]');
  try {
    form.setAttribute('data-submitting', 'true');
    submit.disabled = true;

    // create payload
    const payload = generatePayload(form);
    const response = await fetch(form.dataset.action, {
      method: 'POST',
      body: JSON.stringify({ data: payload }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (response.ok) {
      if (form.dataset.confirmation) {
        window.location.href = form.dataset.confirmation;
      }
    } else {
      const error = await response.text();
      throw new Error(error);
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
  } finally {
    form.setAttribute('data-submitting', 'false');
    submit.disabled = false;
  }
}

// The "Know more and buy your plan in 2 steps" calc form shows a plan-specific
// illustration on the left that swaps with the selected plan, with the promoted
// plan's name + key benefits listed below it (matching live). Keyed by the plan
// <option> value.
const DAM = 'https://www.tataaia.com/content/dam/tataaialifeinsurancecompanylimited/Homepage-Redesign';
const PLAN_INFO = {
  'Wealth plans/ULIPs': {
    image: `${DAM}/Wealth-plans-ULIP.png`,
    plan: 'Param Raksha Life Pro +',
    benefits: [
      'High life cover for comprehensive protection',
      '17.65% 5 yr returns with Multi Cap Fund',
      'Invest in funds rated 4 or 5 Stars by Morningstar',
    ],
  },
  'Term plans': {
    image: `${DAM}/Family-Photo.png`,
    plan: 'Tata AIA Sampoorna Raksha Promise',
    benefits: [
      '₹1.5 Crore life cover starts at ₹678/month',
      'Avail up to 18.5% discount (1st year premium)',
      'Get 100% premium back',
    ],
  },
  'Term + Wealth plans': {
    image: `${DAM}/Term-wealth-plans.png`,
    plan: 'Param Raksha Life Pro +',
    benefits: [
      '₹1 Cr life cover + market-linked returns',
      '17.65% 5 yr returns with Multi Cap Fund',
      'Invest in funds rated 4 or 5 Stars by Morningstar',
    ],
  },
  'Guaranteed returns plan': {
    image: `${DAM}/guaranteed-returns.png`,
    plan: 'Fortune Guarantee Plus',
    benefits: [
      'Guaranteed returns for financial goals',
      'Life cover for family protection',
      'Tax benefits as per applicable laws',
    ],
  },
  'Retirement/Pension plans': {
    image: `${DAM}/Retirement-plans1.png`,
    plan: 'Tata AIA Smart Pension Secure',
    benefits: [
      'Build retirement corpus with top rated funds',
      'Zero premium allocation charges',
      'Withdraw fund for emergencies',
    ],
  },
  'Health plans': {
    image: `${DAM}/Health-plans.png`,
    plan: 'Tata AIA Sampoorna Care – Cancer',
    benefits: [
      'Flexible payouts on cancer diagnosis',
      'Cancer plan with income replacement',
      'Premium rate fixed for 30 years',
    ],
  },
};

/**
 * Turn the plan <select> into a row of tabs across the top and add a left
 * illustration panel that swaps with the selected plan — matching the live
 * "Know more and buy your plan in 2 steps" layout. Progressive enhancement:
 * the underlying <select> stays in the form (kept in sync) so submission and
 * validation are unchanged; if there's no plan select, the form is untouched.
 */
function enhancePlanLayout(block, form) {
  const planSelect = form.querySelector('select[name="plan"]');
  if (!planSelect) return;
  const planFieldWrapper = planSelect.closest('.field-wrapper') || planSelect.parentElement;
  const options = [...planSelect.options];

  // Tab bar (rendered above the form, full width).
  const tabs = document.createElement('div');
  tabs.className = 'form-plan-tabs';
  tabs.setAttribute('role', 'tablist');

  // Left illustration panel: image on top, plan name + benefit list below.
  const media = document.createElement('div');
  media.className = 'form-plan-media';
  const img = document.createElement('img');
  img.loading = 'lazy';
  img.alt = '';
  const caption = document.createElement('div');
  caption.className = 'form-plan-caption';
  const planName = document.createElement('p');
  planName.className = 'form-plan-name';
  const benefitList = document.createElement('ul');
  benefitList.className = 'form-plan-benefits';
  caption.append(planName, benefitList);
  media.append(img, caption);

  const setActive = (value) => {
    planSelect.value = value;
    planSelect.dispatchEvent(new Event('change', { bubbles: true }));
    tabs.querySelectorAll('button').forEach((b) => {
      b.setAttribute('aria-selected', String(b.dataset.value === value));
    });
    const info = PLAN_INFO[value];
    if (info) {
      img.src = info.image;
      img.alt = value;
      planName.textContent = info.plan;
      benefitList.innerHTML = '';
      info.benefits.forEach((text) => {
        const li = document.createElement('li');
        li.textContent = text;
        benefitList.append(li);
      });
    }
  };

  options.forEach((opt) => {
    if (!opt.value) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'form-plan-tab';
    btn.dataset.value = opt.value;
    btn.textContent = opt.textContent.trim();
    btn.setAttribute('role', 'tab');
    btn.addEventListener('click', () => setActive(opt.value));
    tabs.append(btn);
  });

  // Hide the original select field (tabs drive it now), keep it for submit.
  // Use a class (not the [hidden] attr) since the block CSS sets display on
  // .field-wrapper, which would override the attribute.
  if (planFieldWrapper) planFieldWrapper.classList.add('form-plan-select-hidden');

  // Restructure: [tabs] on top, then [media | form fields] two-column body.
  const body = document.createElement('div');
  body.className = 'form-plan-body';
  const heading = form.querySelector('.heading-wrapper');
  block.textContent = '';
  if (heading) block.append(heading);
  block.append(tabs);
  body.append(media, form);
  block.append(body);

  // Default to the first plan.
  const first = options.find((o) => o.value);
  if (first) setActive(first.value);
}

// Resolve the form-definition JSON URL from a reference that may be an <a> href
// OR plain text (AEM's crosswalk render drops the anchor and leaves the JSON
// filename as text). Also fixes the path: a bare "foo.json" on a page served at
// "/" would resolve to "/foo.json" (404) while the asset is published under
// "/content/foo.json" — so we probe both.
async function resolveFormJson(block) {
  // 1) any explicit .json anchor
  const anchors = [...block.querySelectorAll('a')].map((a) => a.getAttribute('href') || a.href);
  let ref = anchors.find((h) => h && h.endsWith('.json'));
  // 2) fall back to plain-text cell content that looks like a .json filename
  if (!ref) {
    const textRef = [...block.querySelectorAll('div, p')]
      .map((el) => el.textContent.trim())
      .find((t) => /^[\w./-]+\.json$/.test(t));
    if (textRef) ref = textRef;
  }
  if (!ref) return null;

  // Build candidate URLs (absolute, root, and /content/ fallback).
  const name = ref.split('/').pop();
  const candidates = [];
  if (/^https?:\/\//.test(ref)) candidates.push(ref);
  else candidates.push(new URL(ref, window.location.href).href);
  candidates.push(new URL(`/${name}`, window.location.origin).href);
  candidates.push(new URL(`/content/${name}`, window.location.origin).href);

  // Return the first candidate that actually fetches OK (sequential, deduped).
  const unique = [...new Set(candidates)];
  const tryFetch = async (url) => {
    try {
      const resp = await fetch(url, { method: 'GET' });
      return resp.ok ? url : null;
    } catch (e) {
      return null;
    }
  };
  return unique.reduce(
    (chain, url) => chain.then((found) => found || tryFetch(url)),
    Promise.resolve(null),
  );
}

export default async function decorate(block) {
  const links = [...block.querySelectorAll('a')].map((a) => a.href);
  const formLink = await resolveFormJson(block);
  const submitLink = links.find((link) => link !== formLink)
    || [...block.querySelectorAll('div, p')].map((el) => el.textContent.trim())
      .find((t) => t.startsWith('/') && !t.endsWith('.json'))
    || '/forms/lead-submit';
  if (!formLink) return;

  const form = await createForm(formLink, submitLink);
  block.replaceChildren(form);
  enhancePlanLayout(block, form);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const valid = form.checkValidity();
    if (valid) {
      handleSubmit(form);
    } else {
      const firstInvalidEl = form.querySelector(':invalid:not(fieldset)');
      if (firstInvalidEl) {
        firstInvalidEl.focus();
        firstInvalidEl.scrollIntoView({ behavior: 'smooth' });
      }
    }
  });
}
