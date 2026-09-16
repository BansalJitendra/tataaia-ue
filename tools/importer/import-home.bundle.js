/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-home.js
  var import_home_exports = {};
  __export(import_home_exports, {
    default: () => import_home_default
  });

  // tools/importer/parsers/accordion-list.js
  function parse(element, { document: document2 }) {
    const items = [];
    const fqItems = Array.from(element.querySelectorAll("li.ta-fq-content-li"));
    const headerItems = Array.from(element.querySelectorAll(".accordion-item"))
      .filter((it) => it.querySelector(".custom-accordion-header"));
    if (fqItems.length) {
      fqItems.forEach((li) => {
        const qEl = li.querySelector(".ta-fq-content-qtext");
        const ansEl = li.querySelector(".ta-fq-ans-w");
        const summary = qEl ? qEl.textContent.trim() : "";
        const content = [];
        if (ansEl) {
          const body = ansEl.querySelector(".ta-fq-ans-m") || ansEl;
          Array.from(body.children).forEach((node) => {
            if (node.textContent.trim() || node.querySelector("img")) content.push(node);
          });
        }
        if (summary || content.length) items.push({ summary, content });
      });
    } else if (headerItems.length && !element.querySelector(".accordion-content .faqHeading")) {
      headerItems.forEach((item) => {
        const header = item.querySelector(".custom-accordion-header");
        const body = item.querySelector(".accordion-content");
        const summary = header ? header.textContent.trim() : "";
        const content = [];
        if (body) {
          Array.from(body.children).forEach((node) => {
            if (node.textContent.trim() || node.querySelector("img")) content.push(node);
          });
        }
        if (summary || content.length) items.push({ summary, content });
      });
    } else {
      const container = element.querySelector(".accordion-content") || element;
      const nodes = Array.from(container.children);
      let current = null;
      nodes.forEach((node) => {
        const headingSpan = node.matches && /^H[1-6]$/.test(node.tagName) ? node.querySelector(".faqHeading") : null;
        if (headingSpan) {
          current = { summary: headingSpan.textContent.trim(), content: [] };
          items.push(current);
        } else if (current) {
          if (node.textContent.trim() || node.querySelector("img")) current.content.push(node);
        }
      });
    }
    const hoistedTables = [];
    const hoistedImages = [];
    const cells = [];
    items.forEach((item) => {
      if (!item.summary && !item.content.length) return;
      const summaryFrag = document2.createDocumentFragment();
      if (item.summary) {
        summaryFrag.appendChild(document2.createComment(" field:summary "));
        summaryFrag.appendChild(document2.createTextNode(item.summary));
      }
      const textFrag = document2.createDocumentFragment();
      textFrag.appendChild(document2.createComment(" field:text "));
      item.content.forEach((node) => {
        const clone = node.cloneNode(true);
        if (clone.tagName === "TABLE") {
          hoistedTables.push(clone);
          return;
        }
        const nested = clone.querySelectorAll ? Array.from(clone.querySelectorAll("table")) : [];
        if (nested.length) {
          nested.forEach((t) => { hoistedTables.push(t.cloneNode(true)); t.remove(); });
        }
        // Pull inline images/pictures out of the answer richtext and hoist them
        // (md2jcr's greedy richtext stops at an image mid-answer). Re-emitted as
        // plain default-content after the accordion so they still render.
        const toPicture = (el) => {
          if (el.tagName === "PICTURE") return el;
          const p = document2.createElement("picture");
          p.appendChild(el);
          return p;
        };
        if (clone.tagName === "IMG" || clone.tagName === "PICTURE") {
          hoistedImages.push(toPicture(clone));
          return;
        }
        if (clone.querySelectorAll) {
          clone.querySelectorAll("picture, img").forEach((im) => {
            const pic = im.closest("picture") || im;
            hoistedImages.push(toPicture(pic.cloneNode(true)));
            if (pic.parentNode) pic.parentNode.removeChild(pic);
          });
        }
        if (clone.textContent.trim()) textFrag.appendChild(clone);
      });
      cells.push([summaryFrag, textFrag]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "accordion-list", cells });
    element.replaceWith(block);
    const fieldNames = ["column1text", "column2text", "column3text"];
    hoistedTables.forEach((table) => {
      const rows = Array.from(table.querySelectorAll("tr"));
      const tableCells = [];
      rows.forEach((tr) => {
        const tds = Array.from(tr.querySelectorAll(":scope > td, :scope > th"));
        if (!tds.length) return;
        const rowCells = [];
        for (let i = 0; i < 3; i += 1) {
          const frag = document2.createDocumentFragment();
          const td = tds[i];
          if (td && td.textContent.trim()) {
            frag.appendChild(document2.createComment(` field:${fieldNames[i]} `));
            Array.from(td.childNodes).forEach((n) => frag.appendChild(n.cloneNode(true)));
          }
          rowCells.push(frag);
        }
        tableCells.push(rowCells);
      });
      if (tableCells.length) {
        const tableBlock = WebImporter.Blocks.createBlock(document2, { name: "table-data", cells: tableCells });
        block.after(tableBlock);
      }
    });
    if (hoistedImages.length) {
      const wrapper = document2.createElement("div");
      hoistedImages.forEach((pic) => {
        const p = document2.createElement("p");
        p.appendChild(pic);
        wrapper.appendChild(p);
      });
      let anchor = block;
      while (anchor.nextElementSibling
        && anchor.nextElementSibling.classList
        && anchor.nextElementSibling.classList.contains("table-data")) {
        anchor = anchor.nextElementSibling;
      }
      anchor.after(...wrapper.childNodes);
    }
  }

  // tools/importer/parsers/cards-article.js
  function parse2(element, { document: document2 }) {
    function normalizeImg(img) {
      if (!img) return null;
      const src = img.getAttribute("src") || img.getAttribute("data-src") || img.getAttribute("data-cmp-filereference");
      if (!src) return null;
      const out = document2.createElement("img");
      out.setAttribute("src", src);
      const alt = img.getAttribute("alt");
      if (alt) out.setAttribute("alt", alt);
      return out;
    }
    function extractSectionHeading(itemSelector) {
      const headings = Array.from(element.querySelectorAll("h1, h2, h3, h4"));
      for (const h of headings) {
        if (itemSelector && h.closest(itemSelector)) continue;
        const text = h.textContent.trim();
        if (text) {
          const out = document2.createElement(h.tagName.toLowerCase());
          out.textContent = text;
          return out;
        }
      }
      return null;
    }
    const sectionHeading = extractSectionHeading(".things-card-layout");
    const cards = Array.from(element.querySelectorAll(".things-card-layout"));
    const cells = [];
    cards.forEach((card) => {
      const img = normalizeImg(card.querySelector(".picture-wrapper img, img"));
      const tag = card.querySelector(".things-card-tag");
      const titleEl = card.querySelector(".blog-car-static-anly-linkpos");
      const linkEl = card.querySelector("a[href]");
      const href = linkEl ? linkEl.getAttribute("href") : null;
      const imageFrag = document2.createDocumentFragment();
      if (img) {
        imageFrag.appendChild(document2.createComment(" field:media_image "));
        imageFrag.appendChild(img);
      }
      const textFrag = document2.createDocumentFragment();
      textFrag.appendChild(document2.createComment(" field:text "));
      if (tag && tag.textContent.trim()) {
        const p = document2.createElement("p");
        p.textContent = tag.textContent.trim();
        textFrag.appendChild(p);
      }
      if (titleEl && titleEl.textContent.trim()) {
        const h = document2.createElement("h3");
        const text = titleEl.textContent.trim();
        if (href) {
          const a = document2.createElement("a");
          a.setAttribute("href", href);
          a.textContent = text;
          h.appendChild(a);
        } else {
          h.textContent = text;
        }
        textFrag.appendChild(h);
      }
      if (img || titleEl) cells.push([imageFrag, textFrag]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-article", cells });
    if (sectionHeading) {
      element.replaceWith(sectionHeading, block);
    } else {
      element.replaceWith(block);
    }
  }

  // tools/importer/parsers/cards-award.js
  function parse3(element, { document: document2 }) {
    function normalizeImg(img) {
      if (!img) return null;
      const src = img.getAttribute("src") || img.getAttribute("data-src") || img.getAttribute("data-cmp-filereference");
      if (!src) return null;
      const out = document2.createElement("img");
      out.setAttribute("src", src);
      const alt = img.getAttribute("alt");
      if (alt) out.setAttribute("alt", alt);
      return out;
    }
    let cards = Array.from(element.querySelectorAll(".leadproxyv2teaser"));
    if (!cards.length) cards = Array.from(element.querySelectorAll(".cmp-teaser"));
    const cells = [];
    cards.forEach((card) => {
      const img = normalizeImg(card.querySelector(".cmp-teaser__image img, img"));
      const desc = card.querySelector(".cmp-teaser__description");
      const paras = desc ? Array.from(desc.querySelectorAll("p")) : [];
      const imageFrag = document2.createDocumentFragment();
      if (img) {
        imageFrag.appendChild(document2.createComment(" field:media_image "));
        imageFrag.appendChild(img);
      }
      const textFrag = document2.createDocumentFragment();
      textFrag.appendChild(document2.createComment(" field:text "));
      if (paras.length) {
        paras.forEach((p) => {
          if (p.textContent.trim()) {
            const np = document2.createElement("p");
            np.textContent = p.textContent.trim();
            textFrag.appendChild(np);
          }
        });
      } else if (desc && desc.textContent.trim()) {
        const np = document2.createElement("p");
        np.textContent = desc.textContent.trim();
        textFrag.appendChild(np);
      }
      if (img || paras.length) cells.push([imageFrag, textFrag]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-award", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-persona.js
  function parse4(element, { document: document2 }) {
    function normalizeImg(img) {
      if (!img) return null;
      const src = img.getAttribute("src") || img.getAttribute("data-src") || img.getAttribute("data-cmp-filereference");
      if (!src) return null;
      const out = document2.createElement("img");
      out.setAttribute("src", src);
      const alt = img.getAttribute("alt");
      if (alt) out.setAttribute("alt", alt);
      return out;
    }
    function extractSectionHeading(itemSelector) {
      const headings = Array.from(element.querySelectorAll("h1, h2, h3, h4"));
      for (const h of headings) {
        if (itemSelector && h.closest(itemSelector)) continue;
        const text = h.textContent.trim();
        if (text) {
          const out = document2.createElement(h.tagName.toLowerCase());
          out.textContent = text;
          return out;
        }
      }
      return null;
    }
    const sectionHeading = extractSectionHeading(".proxyteaserv2, .cmp-teaser");
    let cards = Array.from(element.querySelectorAll(".proxyteaserv2"));
    if (!cards.length) cards = Array.from(element.querySelectorAll(".cmp-teaser"));
    const cells = [];
    cards.forEach((card) => {
      const img = normalizeImg(card.querySelector(".cmp-teaser__image img, img"));
      const heading = card.querySelector(".cmp-teaser__description h3, .cmp-teaser__title, h3, h4");
      const anchor = heading ? heading.querySelector("a") : null;
      const href = anchor ? anchor.getAttribute("href") : null;
      const imageFrag = document2.createDocumentFragment();
      if (img) {
        imageFrag.appendChild(document2.createComment(" field:media_image "));
        imageFrag.appendChild(img);
      }
      const textFrag = document2.createDocumentFragment();
      textFrag.appendChild(document2.createComment(" field:text "));
      if (heading) {
        const h = document2.createElement("h3");
        const text = heading.textContent.trim();
        if (href) {
          const a = document2.createElement("a");
          a.setAttribute("href", href);
          a.textContent = text;
          h.appendChild(a);
        } else {
          h.textContent = text;
        }
        textFrag.appendChild(h);
      }
      if (img || heading) cells.push([imageFrag, textFrag]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-persona", cells });
    if (sectionHeading) {
      element.replaceWith(sectionHeading, block);
    } else {
      element.replaceWith(block);
    }
  }

  // tools/importer/parsers/cards-plan.js
  function parse5(element, { document: document2 }) {
    function normalizeImg(img) {
      if (!img) return null;
      const src = img.getAttribute("src") || img.getAttribute("data-src") || img.getAttribute("data-cmp-filereference");
      if (!src) return null;
      const out = document2.createElement("img");
      out.setAttribute("src", src);
      const alt = img.getAttribute("alt");
      if (alt) out.setAttribute("alt", alt);
      return out;
    }
    function extractSectionHeading(itemSelector) {
      const headings = Array.from(element.querySelectorAll("h1, h2, h3, h4"));
      for (const h of headings) {
        if (itemSelector && h.closest(itemSelector)) continue;
        const text = h.textContent.trim();
        if (text) {
          const out = document2.createElement(h.tagName.toLowerCase());
          out.textContent = text;
          return out;
        }
      }
      return null;
    }
    const sectionHeading = extractSectionHeading("a.gradient-wrapper");
    const cards = Array.from(element.querySelectorAll("a.gradient-wrapper"));
    const cells = [];
    cards.forEach((card) => {
      const href = card.getAttribute("href");
      const img = normalizeImg(card.querySelector(".bannerCategoryImg img, img"));
      const heading = card.querySelector(".bannerCategoryText h3, h3");
      const tag = card.querySelector(".bannerCategoryCardTags");
      const desc = card.querySelector(".bannerCategoryText p");
      const imageFrag = document2.createDocumentFragment();
      if (img) {
        imageFrag.appendChild(document2.createComment(" field:media_image "));
        imageFrag.appendChild(img);
      }
      const textFrag = document2.createDocumentFragment();
      textFrag.appendChild(document2.createComment(" field:text "));
      if (tag && tag.textContent.trim()) {
        const p = document2.createElement("p");
        p.textContent = tag.textContent.trim();
        textFrag.appendChild(p);
      }
      if (heading) {
        const h = document2.createElement("h3");
        if (href) {
          const a = document2.createElement("a");
          a.setAttribute("href", href);
          a.textContent = heading.textContent.trim();
          h.appendChild(a);
        } else {
          h.textContent = heading.textContent.trim();
        }
        textFrag.appendChild(h);
      }
      if (desc && desc.textContent.trim()) {
        const p = document2.createElement("p");
        p.innerHTML = desc.innerHTML;
        textFrag.appendChild(p);
      }
      cells.push([imageFrag, textFrag]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-plan", cells });
    if (sectionHeading) {
      element.replaceWith(sectionHeading, block);
    } else {
      element.replaceWith(block);
    }
  }

  // tools/importer/parsers/cards-promo.js
  function parse6(element, { document: document2 }) {
    function normalizeImg(img) {
      if (!img) return null;
      const src = img.getAttribute("src") || img.getAttribute("data-src") || img.getAttribute("data-cmp-filereference");
      if (!src) return null;
      const out = document2.createElement("img");
      out.setAttribute("src", src);
      const alt = img.getAttribute("alt");
      if (alt) out.setAttribute("alt", alt);
      return out;
    }
    function extractSectionHeading(itemSelector) {
      const headings = Array.from(element.querySelectorAll("h1, h2, h3, h4"));
      for (const h of headings) {
        if (itemSelector && h.closest(itemSelector)) continue;
        const text = h.textContent.trim();
        if (text) {
          const out = document2.createElement(h.tagName.toLowerCase());
          out.textContent = text;
          return out;
        }
      }
      return null;
    }
    const sectionHeading = extractSectionHeading(".proxyteaserv2, .cmp-teaser");
    let cards = Array.from(element.querySelectorAll(".proxyteaserv2"));
    if (!cards.length) cards = Array.from(element.querySelectorAll(".cmp-teaser"));
    const cells = [];
    cards.forEach((card) => {
      const img = normalizeImg(card.querySelector(".cmp-teaser__image img, img"));
      const desc = card.querySelector(".cmp-teaser__description");
      const heading = desc ? desc.querySelector("h3, h4, h2") : card.querySelector("h3, h4, h2");
      const ctaAnchor = desc ? desc.querySelector("p a[href]") : null;
      const imageFrag = document2.createDocumentFragment();
      if (img) {
        imageFrag.appendChild(document2.createComment(" field:media_image "));
        imageFrag.appendChild(img);
      }
      const textFrag = document2.createDocumentFragment();
      textFrag.appendChild(document2.createComment(" field:text "));
      if (heading) {
        const h = document2.createElement("h3");
        h.innerHTML = heading.innerHTML;
        textFrag.appendChild(h);
      }
      if (ctaAnchor) {
        const href = ctaAnchor.getAttribute("href");
        const p = document2.createElement("p");
        const a = document2.createElement("a");
        a.setAttribute("href", href);
        a.textContent = ctaAnchor.textContent.trim();
        p.appendChild(a);
        textFrag.appendChild(p);
      }
      if (img || heading) cells.push([imageFrag, textFrag]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-promo", cells });
    if (sectionHeading) {
      element.replaceWith(sectionHeading, block);
    } else {
      element.replaceWith(block);
    }
  }

  // tools/importer/parsers/cards-quicklink.js
  function parse7(element, { document: document2 }) {
    function normalizeImg(img) {
      if (!img) return null;
      const src = img.getAttribute("src") || img.getAttribute("data-src") || img.getAttribute("data-cmp-filereference");
      if (!src) return null;
      const out = document2.createElement("img");
      out.setAttribute("src", src);
      const alt = img.getAttribute("alt");
      if (alt) out.setAttribute("alt", alt);
      return out;
    }
    function extractSectionHeading(itemSelector) {
      const headings = Array.from(element.querySelectorAll("h1, h2, h3, h4"));
      for (const h of headings) {
        if (itemSelector && h.closest(itemSelector)) continue;
        const text = h.textContent.trim();
        if (text) {
          const out = document2.createElement(h.tagName.toLowerCase());
          out.textContent = text;
          return out;
        }
      }
      return null;
    }
    const sectionHeading = extractSectionHeading(".teaserv2, .cmp-teaser");
    let cards = Array.from(element.querySelectorAll(".teaserv2"));
    if (!cards.length) cards = Array.from(element.querySelectorAll(".cmp-teaser"));
    const cells = [];
    cards.forEach((card) => {
      const img = normalizeImg(card.querySelector(".cmp-teaser__image img, img"));
      const heading = card.querySelector(".cmp-teaser__description h3, h3, h4");
      const linkEl = card.querySelector("a.cmp-teaser__link, a[href]");
      const href = linkEl ? linkEl.getAttribute("href") : null;
      const imageFrag = document2.createDocumentFragment();
      if (img) {
        imageFrag.appendChild(document2.createComment(" field:media_image "));
        imageFrag.appendChild(img);
      }
      const textFrag = document2.createDocumentFragment();
      textFrag.appendChild(document2.createComment(" field:text "));
      if (heading) {
        const h = document2.createElement("h3");
        const text = heading.textContent.trim();
        if (href) {
          const a = document2.createElement("a");
          a.setAttribute("href", href);
          a.textContent = text;
          h.appendChild(a);
        } else {
          h.textContent = text;
        }
        textFrag.appendChild(h);
      }
      if (img || heading) cells.push([imageFrag, textFrag]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-quicklink", cells });
    if (sectionHeading) {
      element.replaceWith(sectionHeading, block);
    } else {
      element.replaceWith(block);
    }
  }

  // tools/importer/parsers/cards-stats.js
  function parse8(element, { document: document2 }) {
    function normalizeImg(img) {
      if (!img) return null;
      const src = img.getAttribute("src") || img.getAttribute("data-src") || img.getAttribute("data-cmp-filereference");
      if (!src) return null;
      const out = document2.createElement("img");
      out.setAttribute("src", src);
      const alt = img.getAttribute("alt");
      if (alt) out.setAttribute("alt", alt);
      return out;
    }
    function extractSectionHeading(itemSelector) {
      const headings = Array.from(element.querySelectorAll("h1, h2, h3, h4"));
      for (const h of headings) {
        if (itemSelector && h.closest(itemSelector)) continue;
        const text = h.textContent.trim();
        if (text) {
          const out = document2.createElement(h.tagName.toLowerCase());
          out.textContent = text;
          return out;
        }
      }
      return null;
    }
    const sectionHeading = extractSectionHeading(".proxyteaserv2, .cmp-teaser");
    let cards = Array.from(element.querySelectorAll(".proxyteaserv2"));
    if (!cards.length) cards = Array.from(element.querySelectorAll(".cmp-teaser"));
    const cells = [];
    cards.forEach((card) => {
      const img = normalizeImg(card.querySelector(".cmp-teaser__image img, img"));
      const desc = card.querySelector(".cmp-teaser__description");
      const heading = desc ? desc.querySelector("h3, h4, h2") : null;
      const paras = desc ? Array.from(desc.querySelectorAll("p")) : [];
      const imageFrag = document2.createDocumentFragment();
      if (img) {
        imageFrag.appendChild(document2.createComment(" field:media_image "));
        imageFrag.appendChild(img);
      }
      const textFrag = document2.createDocumentFragment();
      textFrag.appendChild(document2.createComment(" field:text "));
      if (heading && heading.textContent.trim()) {
        const h = document2.createElement("h3");
        h.textContent = heading.textContent.trim();
        textFrag.appendChild(h);
      }
      paras.forEach((p) => {
        if (p.textContent.trim()) {
          const np = document2.createElement("p");
          np.innerHTML = p.innerHTML;
          textFrag.appendChild(np);
        }
      });
      if (img || heading || paras.length) cells.push([imageFrag, textFrag]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-stats", cells });
    if (sectionHeading) {
      element.replaceWith(sectionHeading, block);
    } else {
      element.replaceWith(block);
    }
  }

  // tools/importer/parsers/carousel-banner.js
  function parseBanner(element, { document: document2 }) {
    const slides = Array.from(element.querySelectorAll(".extendedimage"));
    const resolveSrc = (img) => (img
      && (img.getAttribute("src") || img.getAttribute("data-src") || img.getAttribute("data-cmp-src")))
      || null;
    const buildPicture = (src, alt) => {
      if (!src) return null;
      const picture = document2.createElement("picture");
      const img = document2.createElement("img");
      img.setAttribute("src", src);
      if (alt) img.setAttribute("alt", alt);
      picture.appendChild(img);
      return picture;
    };
    const cells = [];
    slides.forEach((slide) => {
      const deskLink = slide.querySelector("a.cmp-image__link");
      const deskImg = slide.querySelector('.cmp-image__image, [data-cmp-hook-image="image"]')
        || (deskLink ? deskLink.querySelector("img") : null);
      const mobAnchor = slide.querySelector("a.extended__mobileanchor");
      const mobImg = slide.querySelector(".extended__mobileanchorimage, .extended__mobileimage")
        || (mobAnchor ? mobAnchor.querySelector("img") : null);
      const title = slide.getAttribute("data-title") || (deskImg && deskImg.getAttribute("alt")) || "";
      const href = (deskLink && deskLink.getAttribute("href")) || (mobAnchor && mobAnchor.getAttribute("href")) || null;
      const deskSrc = resolveSrc(deskImg);
      const mobSrc = resolveSrc(mobImg);
      if (!deskSrc && !mobSrc) return;
      const imgCell = document2.createElement("div");
      imgCell.appendChild(document2.createComment(" field:media_image "));
      const p = document2.createElement("p");
      const pic = buildPicture(deskSrc || mobSrc, title);
      if (pic) p.appendChild(pic);
      imgCell.appendChild(p);
      const altCell = document2.createElement("div");
      altCell.appendChild(document2.createComment(" field:media_imageAlt "));
      if (title) altCell.appendChild(document2.createTextNode(title));
      cells.push([imgCell, altCell]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "carousel-banner", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/carousel-review.js
  function parse9(element, { document: document2 }) {
    function normalizeImg(img) {
      if (!img) return null;
      const src = img.getAttribute("src") || img.getAttribute("data-src") || img.getAttribute("data-cmp-filereference");
      if (!src) return null;
      const out = document2.createElement("img");
      out.setAttribute("src", src);
      const alt = img.getAttribute("alt");
      if (alt) out.setAttribute("alt", alt);
      return out;
    }
    function extractSectionHeading(itemSelector) {
      const headings = Array.from(element.querySelectorAll("h1, h2, h3, h4"));
      for (const h of headings) {
        if (itemSelector && h.closest(itemSelector)) continue;
        const text = h.textContent.trim();
        if (text) {
          const out = document2.createElement(h.tagName.toLowerCase());
          out.textContent = text;
          return out;
        }
      }
      return null;
    }
    const sectionHeading = extractSectionHeading(".newextendedteaser");
    const slides = Array.from(element.querySelectorAll(".newextendedteaser.teaser, .newextendedteaser"));
    const cells = [];
    slides.forEach((slide) => {
      let img = normalizeImg(slide.querySelector(".profile-image-wrapper img"));
      if (!img) {
        const imgs = Array.from(slide.querySelectorAll("img")).map((i) => {
          const src = i.getAttribute("src") || i.getAttribute("data-src") || "";
          return { i, src };
        }).filter(({ src }) => src && !/quote\.svg|fullstar\.svg|halfstar\.svg|common-icons/i.test(src));
        if (imgs.length) img = normalizeImg(imgs[imgs.length - 1].i);
      }
      const title = slide.querySelector(".title");
      const company = slide.querySelector(".company-name");
      const pretitle = slide.querySelector(".pretitle");
      const desc = slide.querySelector(".description");
      const mediaFrag = document2.createDocumentFragment();
      if (img) {
        mediaFrag.appendChild(document2.createComment(" field:media_image "));
        mediaFrag.appendChild(img);
      }
      const contentFrag = document2.createDocumentFragment();
      contentFrag.appendChild(document2.createComment(" field:content_text "));
      if (title && title.textContent.trim()) {
        const h = document2.createElement("h3");
        h.textContent = title.textContent.trim();
        contentFrag.appendChild(h);
      }
      [company, pretitle, desc].forEach((el) => {
        if (el && el.textContent.trim()) {
          const p = document2.createElement("p");
          p.textContent = el.textContent.trim();
          contentFrag.appendChild(p);
        }
      });
      if (img || title || desc) cells.push([mediaFrag, contentFrag]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "carousel-review", cells });
    if (sectionHeading) {
      element.replaceWith(sectionHeading, block);
    } else {
      element.replaceWith(block);
    }
  }

  // tools/importer/parsers/carousel-video.js
  function parse10(element, { document: document2 }) {
    function pickThumb(slide) {
      const thumb = slide.getAttribute("data-thumbnail");
      if (thumb) {
        const img = document2.createElement("img");
        img.setAttribute("src", thumb);
        const title = slide.getAttribute("data-card-title");
        if (title) img.setAttribute("alt", title);
        return img;
      }
      const posterImg = slide.querySelector(".reels-poster img, picture img, img");
      if (posterImg) {
        const src = posterImg.getAttribute("src") || posterImg.getAttribute("data-src");
        if (src) {
          const img = document2.createElement("img");
          img.setAttribute("src", src);
          const alt = posterImg.getAttribute("alt");
          if (alt) img.setAttribute("alt", alt);
          return img;
        }
      }
      return null;
    }
    function extractSectionHeading(itemSelector) {
      const headings = Array.from(element.querySelectorAll("h1, h2, h3, h4"));
      for (const h of headings) {
        if (itemSelector && h.closest(itemSelector)) continue;
        const text = h.textContent.trim();
        if (text) {
          const out = document2.createElement(h.tagName.toLowerCase());
          out.textContent = text;
          return out;
        }
      }
      return null;
    }
    const sectionHeading = extractSectionHeading(".videoIframe, .swiper-slide");
    const slides = Array.from(element.querySelectorAll(".videoIframe, .swiper-slide"));
    const cells = [];
    slides.forEach((slide) => {
      const img = pickThumb(slide);
      const videoUrl = slide.getAttribute("data-video-source");
      const titleAttr = slide.getAttribute("data-card-title");
      const titleEl = slide.querySelector(".reels-title, p");
      const title = titleAttr || (titleEl ? titleEl.textContent.trim() : "");
      const mediaFrag = document2.createDocumentFragment();
      if (img) {
        mediaFrag.appendChild(document2.createComment(" field:media_image "));
        mediaFrag.appendChild(img);
      }
      const contentFrag = document2.createDocumentFragment();
      contentFrag.appendChild(document2.createComment(" field:content_text "));
      if (title) {
        const p = document2.createElement("p");
        if (videoUrl) {
          const a = document2.createElement("a");
          a.setAttribute("href", videoUrl);
          a.textContent = title;
          p.appendChild(a);
        } else {
          p.textContent = title;
        }
        contentFrag.appendChild(p);
      }
      if (img || title) cells.push([mediaFrag, contentFrag]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "carousel-video", cells });
    if (sectionHeading) {
      element.replaceWith(sectionHeading, block);
    } else {
      element.replaceWith(block);
    }
  }

  // tools/importer/parsers/columns-panels.js
  function parse11(element, { document: document2 }) {
    const textBlocks = Array.from(element.querySelectorAll(".cmp-text"));
    const columnCells = [];
    textBlocks.forEach((tb) => {
      if (!tb.textContent.trim()) return;
      const cell = document2.createElement("div");
      Array.from(tb.children).forEach((child) => {
        if (child.textContent.trim() || child.querySelector("img")) {
          cell.appendChild(child.cloneNode(true));
        }
      });
      if (cell.childNodes.length) columnCells.push(cell);
    });
    if (!columnCells.length) {
      const cell = document2.createElement("div");
      const p = document2.createElement("p");
      p.textContent = element.textContent.trim();
      cell.appendChild(p);
      columnCells.push(cell);
    }
    const cells = [columnCells];
    const block = WebImporter.Blocks.createBlock(document2, { name: "columns-panels", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/form.js
  const FORM_DEFINITIONS = {
    "new-homepage-calc-container": "know-more-buy-2steps.json",
    "tte-form-redesign": "looking-to-buy-callback.json",
  };
  const FORM_ACTIONS = {
    "new-homepage-calc-container": "/forms/lead-submit",
    "tte-form-redesign": "/forms/lead-submit",
  };
  function parse12(element, { document: document2 }) {
    const formEl = element.querySelector("form");
    let referenceHref = null;
    const jsonLink = element.querySelector('a[href$=".json"]');
    if (jsonLink) referenceHref = jsonLink.getAttribute("href");
    if (!referenceHref) {
      const mapped = Object.keys(FORM_DEFINITIONS)
        .find((cls) => element.classList.contains(cls) || element.closest(`.${cls}`));
      if (mapped) referenceHref = FORM_DEFINITIONS[mapped];
    }
    let actionUrl = null;
    if (formEl) {
      actionUrl = formEl.getAttribute("action") || formEl.getAttribute("data-action") || formEl.getAttribute("data-url") || null;
    }
    if (!actionUrl && referenceHref) {
      const mapped = Object.keys(FORM_ACTIONS)
        .find((cls) => element.classList.contains(cls) || element.closest(`.${cls}`));
      if (mapped) actionUrl = FORM_ACTIONS[mapped];
    }
    const cells = [];
    const referenceFrag = document2.createDocumentFragment();
    if (referenceHref) {
      referenceFrag.appendChild(document2.createComment(" field:reference "));
      const a = document2.createElement("a");
      a.setAttribute("href", referenceHref);
      a.textContent = referenceHref;
      referenceFrag.appendChild(a);
    }
    cells.push([referenceFrag]);
    const actionFrag = document2.createDocumentFragment();
    if (actionUrl) {
      actionFrag.appendChild(document2.createComment(" field:action "));
      const a = document2.createElement("a");
      a.setAttribute("href", actionUrl);
      a.textContent = actionUrl;
      actionFrag.appendChild(a);
    }
    cells.push([actionFrag]);
    const block = WebImporter.Blocks.createBlock(document2, { name: "form", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/hero-banner.js
  function parse13(element, { document: document2 }) {
    function normalizeImg(img) {
      if (!img) return null;
      const src = img.getAttribute("src") || img.getAttribute("data-src") || img.getAttribute("data-asset") || img.getAttribute("data-cmp-filereference");
      if (!src) return null;
      if (/prev-arrow|next-arrow|common-icons|arrow\.svg/i.test(src)) return null;
      const out = document2.createElement("img");
      out.setAttribute("src", src);
      const alt = img.getAttribute("alt");
      if (alt && !/prev|next|button/i.test(alt)) out.setAttribute("alt", alt);
      return out;
    }
    let bgImage = null;
    const pictureSource = element.querySelector("picture source[srcset], picture source[data-srcset]");
    if (pictureSource) {
      const src = pictureSource.getAttribute("srcset") || pictureSource.getAttribute("data-srcset");
      if (src) {
        bgImage = document2.createElement("img");
        bgImage.setAttribute("src", src.split(",")[0].trim().split(" ")[0]);
      }
    }
    if (!bgImage) {
      const imgs = Array.from(element.querySelectorAll("img"));
      for (const img of imgs) {
        const norm = normalizeImg(img);
        if (norm) {
          bgImage = norm;
          break;
        }
      }
    }
    const heading = element.querySelector('h1, h2, h3, .banner-title, [class*="title"]:not([class*="banner-slider"])');
    const paras = Array.from(element.querySelectorAll("p")).filter((p) => p.textContent.trim());
    const ctas = Array.from(element.querySelectorAll("a[href]")).filter((a) => a.textContent.trim() && !/slide/i.test(a.getAttribute("aria-label") || ""));
    // `.banner-asset-container` holds only the slider's prev/next arrow chrome —
    // no banner image and no text (real banners are in the carousel-banner).
    // Drop the element when nothing real is extracted rather than emit an empty
    // placeholder that renders the CSS fallback gradient.
    if (!bgImage && !(heading && heading.textContent.trim()) && !paras.length && !ctas.length) {
      element.remove();
      return;
    }
    const cells = [];
    const imageFrag = document2.createDocumentFragment();
    if (bgImage) {
      imageFrag.appendChild(document2.createComment(" field:media_image "));
      imageFrag.appendChild(bgImage);
    }
    cells.push([imageFrag]);
    const textFrag = document2.createDocumentFragment();
    textFrag.appendChild(document2.createComment(" field:text "));
    if (heading && heading.textContent.trim()) {
      const h = document2.createElement("h2");
      h.textContent = heading.textContent.trim();
      textFrag.appendChild(h);
    }
    paras.forEach((p) => {
      const np = document2.createElement("p");
      np.innerHTML = p.innerHTML;
      textFrag.appendChild(np);
    });
    ctas.forEach((a) => {
      const p = document2.createElement("p");
      const link = document2.createElement("a");
      link.setAttribute("href", a.getAttribute("href"));
      link.textContent = a.textContent.trim();
      p.appendChild(link);
      textFrag.appendChild(p);
    });
    cells.push([textFrag]);
    const block = WebImporter.Blocks.createBlock(document2, { name: "hero-banner", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/hero-promo.js — multi-slide carousel (container + items)
  function parse14(element, { document: document2 }) {
    let slides = Array.from(element.querySelectorAll(".swiper-slide")).filter((s) => !s.classList.contains("swiper-slide-duplicate"));
    if (!slides.length) slides = [element];
    const seenBg = /* @__PURE__ */ new Set();
    const pickBgImage = (slide) => {
      const sources = Array.from(slide.querySelectorAll("picture source[srcset], picture source[data-srcset]"));
      const chosen = sources.find((s) => /min-width/i.test(s.getAttribute("media") || "")) || sources[0];
      if (chosen) {
        const srcset = chosen.getAttribute("srcset") || chosen.getAttribute("data-srcset");
        if (srcset) {
          const img2 = document2.createElement("img");
          img2.setAttribute("src", srcset.split(",")[0].trim().split(" ")[0]);
          const pic = chosen.closest("picture");
          const pImg = pic ? pic.querySelector("img") : null;
          const alt = pImg ? pImg.getAttribute("alt") : null;
          if (alt) img2.setAttribute("alt", alt);
          return img2;
        }
      }
      const bare = slide.querySelector('img[src]:not([src=""]), img[data-src]');
      if (bare) {
        const src = bare.getAttribute("src") || bare.getAttribute("data-src");
        if (src) {
          const img2 = document2.createElement("img");
          img2.setAttribute("src", src);
          const alt = bare.getAttribute("alt");
          if (alt) img2.setAttribute("alt", alt);
          return img2;
        }
      }
      return null;
    };
    const cells = [];
    slides.forEach((slide) => {
      const bgImage = pickBgImage(slide);
      const bgKey = bgImage ? bgImage.getAttribute("src") : null;
      if (bgKey) {
        if (seenBg.has(bgKey)) return;
        seenBg.add(bgKey);
      }
      const textBlocks = Array.from(slide.querySelectorAll(".cmp-text p, .banner-pretitle p, .pretitle-title p, .banner-pointers p")).filter((p) => p.textContent.trim());
      const cta = slide.querySelector("a.cmp-button, .cmp-button a, a[href]");
      const imageFrag = document2.createDocumentFragment();
      if (bgImage) {
        imageFrag.appendChild(document2.createComment(" field:media_image "));
        imageFrag.appendChild(bgImage);
      }
      const textFrag = document2.createDocumentFragment();
      textFrag.appendChild(document2.createComment(" field:content_text "));
      const seen = /* @__PURE__ */ new Set();
      textBlocks.forEach((p) => {
        const txt = p.textContent.trim();
        if (seen.has(txt)) return;
        seen.add(txt);
        const np = document2.createElement("p");
        np.innerHTML = p.innerHTML;
        textFrag.appendChild(np);
      });
      if (cta && cta.getAttribute && cta.getAttribute("href")) {
        const p = document2.createElement("p");
        const a = document2.createElement("a");
        a.setAttribute("href", cta.getAttribute("href"));
        a.textContent = (cta.textContent || "").trim() || "Buy now";
        p.appendChild(a);
        textFrag.appendChild(p);
      }
      cells.push([imageFrag, textFrag]);
    });
    if (!cells.length) {
      element.remove();
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "hero-promo", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/quote-callout.js
  function parse15(element, { document: document2 }) {
    const anchor = element.querySelector("a[href]");
    const labelEl = element.querySelector(".cmp-button__text, .cmp-button span");
    const label = labelEl ? labelEl.textContent.trim() : anchor ? anchor.textContent.trim() : element.textContent.trim();
    const href = anchor ? anchor.getAttribute("href") : null;
    if (!label && !href) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    const quotationFrag = document2.createDocumentFragment();
    quotationFrag.appendChild(document2.createComment(" field:quotation "));
    const p = document2.createElement("p");
    if (href) {
      const a = document2.createElement("a");
      a.setAttribute("href", href);
      a.textContent = label || "Quote/Benefit Illustration";
      p.appendChild(a);
    } else {
      p.textContent = label;
    }
    quotationFrag.appendChild(p);
    cells.push([quotationFrag]);
    const attributionFrag = document2.createDocumentFragment();
    cells.push([attributionFrag]);
    const block = WebImporter.Blocks.createBlock(document2, { name: "quote-callout", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/table-data.js
  function parse16(element, { document: document2 }) {
    const table = element.matches("table") ? element : element.querySelector("table");
    const rows = table ? Array.from(table.querySelectorAll("tr")) : [];
    const cells = [];
    const fieldNames = ["column1text", "column2text", "column3text"];
    rows.forEach((tr) => {
      const tds = Array.from(tr.querySelectorAll(":scope > td, :scope > th"));
      if (!tds.length) return;
      const rowCells = [];
      for (let i = 0; i < 3; i += 1) {
        const frag = document2.createDocumentFragment();
        const td = tds[i];
        if (td && td.textContent.trim()) {
          frag.appendChild(document2.createComment(` field:${fieldNames[i]} `));
          Array.from(td.childNodes).forEach((n) => frag.appendChild(n.cloneNode(true)));
        }
        rowCells.push(frag);
      }
      cells.push(rowCells);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "table-data", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/tabs-links.js
  function parse17(element, { document: document2 }) {
    const heading = element.querySelector(".popular-searches-heading h2, h2, h3");
    const title = heading ? heading.textContent.trim() : "Popular Searches";
    const anchors = Array.from(element.querySelectorAll(".popular-searches-btns a[href], .cmp-teaser__description a[href]")).filter((a) => a.textContent.trim());
    const cells = [];
    const titleFrag = document2.createDocumentFragment();
    titleFrag.appendChild(document2.createComment(" field:title "));
    titleFrag.appendChild(document2.createTextNode(title));
    const contentFrag = document2.createDocumentFragment();
    contentFrag.appendChild(document2.createComment(" field:content_richtext "));
    const list = document2.createElement("ul");
    anchors.forEach((a) => {
      const li = document2.createElement("li");
      const link = document2.createElement("a");
      link.setAttribute("href", a.getAttribute("href"));
      link.textContent = a.textContent.trim();
      li.appendChild(link);
      list.appendChild(li);
    });
    if (list.childNodes.length) contentFrag.appendChild(list);
    cells.push([titleFrag, contentFrag]);
    const block = WebImporter.Blocks.createBlock(document2, { name: "tabs-links", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/quicklinks-toggle.js
  function parseQuicklinksToggle(element, { document: document2 }) {
    const lists = Array.from(element.querySelectorAll("ul"));
    const findPrompt = (ul) => {
      const scope = ul.closest('[class*="dropdown"], [class*="wishlist"]') || element;
      const label = Array.from(scope.querySelectorAll("*")).find((e) => e.children.length === 0 && /^(i want to|help me to)$/i.test(e.textContent.trim()));
      if (label) return label.textContent.trim();
      const first = (ul.querySelector("a")?.textContent || "").toLowerCase();
      return /buy|save|invest/.test(first) ? "I want to" : "Help me to";
    };
    const buildRow = (personaLabel, prompt, ul) => {
      const labelFrag = document2.createDocumentFragment();
      labelFrag.appendChild(document2.createComment(" field:label "));
      labelFrag.appendChild(document2.createTextNode(personaLabel));
      const linksFrag = document2.createDocumentFragment();
      linksFrag.appendChild(document2.createComment(" field:links "));
      const p = document2.createElement("p");
      p.textContent = prompt;
      linksFrag.appendChild(p);
      linksFrag.appendChild(ul.cloneNode(true));
      return [labelFrag, linksFrag];
    };
    const mapped = lists.map((ul) => ({ prompt: findPrompt(ul), ul })).filter((m) => m.ul.querySelector("a"));
    const wantList = mapped.find((m) => /want/i.test(m.prompt));
    const helpList = mapped.find((m) => /help/i.test(m.prompt));
    const cells = [];
    if (wantList) cells.push(buildRow("I am a new customer", wantList.prompt || "I want to", wantList.ul));
    if (helpList) cells.push(buildRow("Existing customer", helpList.prompt || "Help me to", helpList.ul));
    if (!cells.length) {
      mapped.forEach((m, i) => {
        cells.push(buildRow(i === 0 ? "I am a new customer" : "Existing customer", m.prompt, m.ul));
      });
    }
    if (!cells.length) {
      element.remove();
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "quicklinks-toggle", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-product-recom.js
  function parseColumnsProductRecom(element, { document: document2 }) {
    const DAM = "https://www.tataaia.com/content/dam/tataaialifeinsurancecompanylimited";
    const BANNER_IMG = `${DAM}/hard-code-icons/Product-Recommendation/Banner_Image.png`;
    const h = (html) => {
      const t = document2.createElement("template");
      t.innerHTML = html.trim();
      return t.content;
    };
    const imageFrag = document2.createDocumentFragment();
    const img = document2.createElement("img");
    img.setAttribute("src", BANNER_IMG);
    img.setAttribute("alt", "Family protected by Tata AIA term insurance");
    const imgP = document2.createElement("p");
    imgP.appendChild(img);
    imageFrag.appendChild(imgP);
    const leftFrag = document2.createDocumentFragment();
    leftFrag.appendChild(h(`
      <h2>Can't decide on a term insurance plan?</h2>
      <p>Share your needs and get</p>
      <ul>
        <li>Personalized suggestions</li>
        <li>Customizable quotes</li>
      </ul>
      <p>Non-Linked, Non-Participating, pure risk, Individual Life Insurance Product (UIN:110N176V11)</p>
    `));
    const rightFrag = document2.createDocumentFragment();
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
    const block = WebImporter.Blocks.createBlock(document2, { name: "columns-product-recom", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/tataaia-cleanup.js
  var TransformHook = {
    beforeTransform: "beforeTransform",
    afterTransform: "afterTransform"
  };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      // The "Can't decide on a term insurance plan?" banner (.product-recom-banner)
      // is nested inside the hidden product-recommendation calculator wrappers
      // (.product-recommendation-calcuator / .api-failure-page) that we strip
      // below. Hoist it out to the body first so it survives the cleanup and the
      // product-recom-banner parser can map it. Placed right after the first
      // .term-insurance-maininfo-container (the Life Insurance intro) to keep it
      // in its live position.
      const recomBanner = element.querySelector(".product-recom-banner");
      if (recomBanner) {
        const intro = element.querySelector(".term-insurance-maininfo-container");
        if (intro && intro.parentNode) intro.parentNode.insertBefore(recomBanner, intro.nextSibling);
        else element.appendChild(recomBanner);
      }
      // Leaked popup-close artifact: a "close-popup" image imported as default
      // content renders as a stray ✕ at the top of the page. Remove it (and its
      // now-empty wrapper) before parsing.
      element.querySelectorAll('img[alt="close-popup"], img[src*="close-popup"]').forEach((img) => {
        const wrap = img.closest("p, div") || img;
        wrap.remove();
      });
      WebImporter.DOMUtils.remove(element, [
        // Top-of-body hidden runtime inputs (cleaned.html L2, L4, L6)
        "#otp_require",
        "#payment_otp",
        "#page-path",
        // Adobe ID syncing iframe injected in body (cleaned.html L9)
        "#destination_publishing_iframe_talic_0",
        // Global call/VOIP overlays + popups (cleaned.html L2287, L2290, L2401)
        ".call-us-ta-overlay",
        ".new-call-us-wrapper",
        ".voip-popup-section",
        // Nav search overlay / modal (cleaned.html L3364)
        ".nav-revamp-search-overlay",
        // Screen-reader accessibility popup (cleaned.html L3747)
        ".screen-reader-popup",
        // OTP popups injected near forms (cleaned.html L8791, L9950, ...)
        ".new-otp-popup-section",
        // --- Product-recommendation calculator + its popup/loader/failure states ---
        // Hidden feature containers between the first and second
        // .term-insurance-maininfo-container that leaked into the import as visible
        // default content trailing the first columns-panels block.
        ".product-recommendation-calcuator",
        ".productrecommendation-cal",
        ".production-recommendation-api",
        ".product-recom-form-section",
        ".newcampaignloader",
        ".page-loader-wrapper",
        ".api-failure-page",
        ".vymoapifailuremessage-page",
        ".vymo-api-failure-wrapper",
        ".otp-popup",
        ".new-otp-popup-overlay",
        ".trs-new-otp-popup-overlay",
        ".otppopup-failpopup-wrapper",
        ".otpfailpopup",
        ".need-info-cc-popup-wrapper",
        ".in-fo-search-popup",
        ".ta-modal-wrap",
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
        ".new-header",
        // Mobile + desktop nav menu containers (cleaned.html L56, L58, L162, ...)
        ".newheadercontainer",
        // Mobile sub-navigation panels (cleaned.html L4164, L7018, ...)
        ".mob-sub-navigation",
        // Desktop main-menu click wrappers (cleaned.html L58, L178, L309, ...)
        ".main-header-click",
        // Mobile hamburger menu wrapper (cleaned.html L3793)
        ".navmenuhumberg",
        // Mobile nav experience-fragment wrappers (cleaned.html L4159, L4351, ...)
        '[class*="cmp-experiencefragment--mob-"]',
        // Hamburger nav experience fragment (cleaned.html L3790)
        ".cmp-experiencefragment--Nav-Hamburger-xf",
        // Mobile social-media strip inside nav (cleaned.html L7254)
        ".mob-social-media-sec-wrap"
      ]);
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        // Global footer (cleaned.html L21153)
        ".footer",
        // Sticky mobile footer quick-options bar (cleaned.html L21229, L21237)
        ".ta-thunder-btn-w",
        ".footerSticky",
        // Sticky footer promo banner (cleaned.html L22275)
        ".aia-footer-banner",
        // Runtime analytics / positioning hidden inputs inside content blocks
        // (cleaned.html L7315, L7553)
        ".bannerPosition",
        ".ccBannerAnalyticsData",
        // Post-footer widget chrome (hidden on live): chatbot, sticky calc button,
        // loader gif, on-screen keyboard, date-picker calendar.
        ".chatbot-wrapper",
        ".chatbot-redirect",
        ".calc-premium-btn-wrap",
        ".ta-loader",
        ".keyboardWrapper",
        '[class*="keyboardWrapper"]',
        '[class*="virtual-keyboard"]',
        '[class*="datepicker-calendar"]',
        '[class*="ta-datepicker-cal"]',
        // Non-authorable leftover elements
        "link",
        "noscript",
        "iframe",
        "style"
      ]);
      const KEYBOARD_RE = /QWERTYUIOP|ASDFGHJKL|ZXCVBNM/;
      const WEEKDAYS_RE = /Su.?Mo.?Tu.?We.?Th.?Fr.?Sa/;
      const junkHosts = new Set();
      element.querySelectorAll("div, p, ul").forEach((el) => {
        const text = (el.textContent || "").replace(/\s+/g, "");
        if (KEYBOARD_RE.test(text) || WEEKDAYS_RE.test(text)) {
          let host = el;
          while (host.parentElement
            && host.parentElement !== element
            && (host.parentElement.textContent || "").replace(/\s+/g, "") === text) {
            host = host.parentElement;
          }
          junkHosts.add(host);
        }
      });
      junkHosts.forEach((el) => { if (el.parentNode) el.remove(); });
      element.querySelectorAll('img[src*="lemnisk"]').forEach((img) => {
        const p = img.closest("p");
        (p || img).remove();
      });
      element.querySelectorAll("[data-cmp-data-layer], [data-analytics], [onclick]").forEach((el) => {
        el.removeAttribute("data-cmp-data-layer");
        el.removeAttribute("data-analytics");
        el.removeAttribute("onclick");
      });
    }
  }

  // tools/importer/transformers/tataaia-sections.js
  var SECTION_MARKER_ATTR = "data-excat-section-id";
  function querySection(root, selectors) {
    for (const sel of selectors) {
      const el = root.querySelector(sel);
      if (el) return el;
    }
    return null;
  }
  function transform2(hookName, element, payload) {
    const sections = payload.template && payload.template.sections || [];
    if (hookName === "beforeTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (i === 0 && !section.style) continue;
        const sectionEl = querySection(element, section.selector);
        if (!sectionEl) continue;
        const hr = document.createElement("hr");
        if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
        sectionEl.before(hr);
      }
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (!section.style) continue;
        const marker = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
        const anchor = marker || querySection(element, section.selector);
        if (!anchor) continue;
        const metadataBlock = WebImporter.Blocks.createBlock(document, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        anchor.after(metadataBlock);
        if (marker) {
          marker.removeAttribute(SECTION_MARKER_ATTR);
          if (i === 0) marker.remove();
        }
      }
    }
  }

  // tools/importer/import-home.js
  var parsers = {
    "accordion-list": parse,
    "cards-article": parse2,
    "cards-award": parse3,
    "cards-persona": parse4,
    "cards-plan": parse5,
    "cards-promo": parse6,
    "cards-quicklink": parse7,
    "cards-stats": parse8,
    "carousel-banner": parseBanner,
    "carousel-review": parse9,
    "carousel-video": parse10,
    "columns-panels": parse11,
    "form": parse12,
    "hero-banner": parse13,
    "hero-promo": parse14,
    "quote-callout": parse15,
    "table-data": parse16,
    "tabs-links": parse17,
    "quicklinks-toggle": parseQuicklinksToggle,
    "columns-product-recom": parseColumnsProductRecom
  };
  var PAGE_TEMPLATE = {
    "name": "home",
    "description": "",
    "urls": [
      "https://www.tataaia.com/"
    ],
    "blocks": [
      {
        "name": "hero-promo",
        "instances": [
          ".homepage-banner-slider-container"
        ]
      },
      {
        "name": "hero-banner",
        "instances": [
          ".banner-asset-container"
        ]
      },
      {
        "name": "cards-plan",
        "instances": [
          ".bannerSectionCategoryCards"
        ]
      },
      {
        "name": "quicklinks-toggle",
        "instances": [
          ".homepagewishlistcomp"
        ]
      },
      {
        "name": "columns-product-recom",
        "instances": [
          ".product-recom-banner"
        ]
      },
      {
        "name": "cards-persona",
        "instances": [
          ".term-plan-cards"
        ]
      },
      {
        "name": "cards-quicklink",
        "instances": [
          ".quick-access-cards"
        ]
      },
      {
        "name": "cards-promo",
        "instances": [
          ".quiz-test-cards"
        ]
      },
      {
        "name": "cards-award",
        "instances": [
          ".award-section"
        ]
      },
      {
        "name": "cards-stats",
        "instances": [
          ".whychoose-cards"
        ]
      },
      {
        "name": "carousel-banner",
        "instances": [
          ".banner-slider"
        ]
      },
      {
        "name": "cards-article",
        "instances": [
          ".homepage-revamp-blog-cards"
        ]
      },
      {
        "name": "columns-panels",
        "instances": [
          ".term-insurance-maininfo-container"
        ]
      },
      {
        "name": "accordion-list",
        "instances": [
          ".custom-accordion",
          ".faq-accordian"
        ]
      },
      {
        "name": "carousel-review",
        "instances": [
          ".voiceof-happy-customer"
        ]
      },
      {
        "name": "carousel-video",
        "instances": [
          ".youtubevideoandreels"
        ]
      },
      {
        "name": "quote-callout",
        "instances": [
          ".quote-benefit-Illustration"
        ]
      },
      {
        "name": "table-data",
        "instances": [
          "table"
        ]
      },
      {
        "name": "tabs-links",
        "instances": [
          ".popular-searches-section"
        ]
      },
      {
        "name": "form",
        "instances": [
          ".tte-form-redesign",
          ".new-homepage-calc-container"
        ]
      }
    ],
    "sections": [
      {
        "id": "s1",
        "name": "Promo Hero Banner",
        "selector": [
          ".homepage-banner-slider-container"
        ],
        "style": null,
        "blocks": [
          "hero-promo"
        ],
        "defaultContent": []
      },
      {
        "id": "s2",
        "name": "Top Selling Plans",
        "selector": [
          ".bannerSectionCategoryCards"
        ],
        "style": null,
        "blocks": [
          "cards-plan"
        ],
        "defaultContent": []
      },
      {
        "id": "s2b",
        "name": "Quick links persona toggle",
        "selector": [
          ".homepagewishlistcomp"
        ],
        "style": null,
        "blocks": [
          "quicklinks-toggle"
        ],
        "defaultContent": []
      },
      {
        "id": "s3",
        "name": "Know more and buy in 2 steps",
        "selector": [
          ".tte-form-redesign"
        ],
        "style": null,
        "blocks": [
          "form"
        ],
        "defaultContent": []
      },
      {
        "id": "s4",
        "name": "Life Insurance intro + featured plan",
        "selector": [
          ".term-insurance-maininfo-container"
        ],
        "style": null,
        "blocks": [
          "columns-panels"
        ],
        "defaultContent": []
      },
      {
        "id": "s4b",
        "name": "Can't decide callout",
        "selector": [
          ".product-recom-banner"
        ],
        "style": null,
        "blocks": [
          "columns-product-recom"
        ],
        "defaultContent": []
      },
      {
        "id": "s5",
        "name": "Types of Life Insurance",
        "selector": [
          ".custom-accordion"
        ],
        "style": null,
        "blocks": [
          "accordion-list"
        ],
        "defaultContent": []
      },
      {
        "id": "s6",
        "name": "Life insurance plans for everyone",
        "selector": [
          ".term-plan-cards"
        ],
        "style": null,
        "blocks": [
          "cards-persona"
        ],
        "defaultContent": []
      },
      {
        "id": "s7",
        "name": "Quick access for customers",
        "selector": [
          ".quick-access-cards"
        ],
        "style": null,
        "blocks": [
          "cards-quicklink"
        ],
        "defaultContent": []
      },
      {
        "id": "s8",
        "name": "Find the right plan for you",
        "selector": [
          ".quiz-test-cards"
        ],
        "style": null,
        "blocks": [
          "cards-promo"
        ],
        "defaultContent": []
      },
      {
        "id": "s9",
        "name": "Awards & Recognition",
        "selector": [
          ".award-section"
        ],
        "style": null,
        "blocks": [
          "cards-award"
        ],
        "defaultContent": []
      },
      {
        "id": "s10",
        "name": "Looking to buy a new plan",
        "selector": [
          ".new-homepage-calc-container"
        ],
        "style": "blue-tone-light",
        "blocks": [
          "form"
        ],
        "defaultContent": []
      },
      {
        "id": "s11",
        "name": "Voice of Happy Customers",
        "selector": [
          ".voiceof-happy-customer"
        ],
        "style": null,
        "blocks": [
          "carousel-review"
        ],
        "defaultContent": []
      },
      {
        "id": "s12",
        "name": "Why choose Tata AIA",
        "selector": [
          ".whychoose-cards"
        ],
        "style": null,
        "blocks": [
          "cards-stats"
        ],
        "defaultContent": []
      },
      {
        "id": "s12b",
        "name": "Promo banner carousel",
        "selector": [
          ".banner-slider"
        ],
        "style": null,
        "blocks": [
          "carousel-banner"
        ],
        "defaultContent": []
      },
      {
        "id": "s14",
        "name": "Know about Life Insurance (article)",
        "selector": [
          ".term-insurance-maininfo-container"
        ],
        "style": null,
        "blocks": [
          "table-data"
        ],
        "defaultContent": []
      },
      {
        "id": "s15",
        "name": "Tata AIA callout box",
        "selector": [
          ".quote-benefit-Illustration"
        ],
        "style": "tinted-callout",
        "blocks": [
          "quote-callout"
        ],
        "defaultContent": []
      },
      {
        "id": "s16",
        "name": "FAQs",
        "selector": [
          ".faq-accordian"
        ],
        "style": null,
        "blocks": [
          "accordion-list"
        ],
        "defaultContent": []
      },
      {
        "id": "s17",
        "name": "Related Reels/Videos",
        "selector": [
          ".youtubevideoandreels"
        ],
        "style": null,
        "blocks": [
          "carousel-video"
        ],
        "defaultContent": []
      },
      {
        "id": "s18",
        "name": "Related Articles",
        "selector": [
          ".homepage-revamp-blog-cards"
        ],
        "style": "blue-tone-light",
        "blocks": [
          "cards-article"
        ],
        "defaultContent": []
      },
      {
        "id": "s19",
        "name": "Popular Searches",
        "selector": [
          ".popular-searches-section"
        ],
        "style": null,
        "blocks": [
          "tabs-links"
        ],
        "defaultContent": []
      },
      {
        "id": "s20",
        "name": "Footer link directory",
        "selector": [
          "body > div.root.responsivegrid > div.aem-Grid > div.footer"
        ],
        "style": null,
        "blocks": [],
        "defaultContent": []
      }
    ]
  };
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : []
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: PAGE_TEMPLATE });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document2, template) {
    const pageBlocks = [];
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        let elements = [];
        try {
          elements = document2.querySelectorAll(selector);
        } catch (e) {
          console.warn(`Invalid selector for "${blockDef.name}": ${selector}`);
          return;
        }
        if (elements.length === 0) {
          console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
        }
        elements.forEach((element) => {
          pageBlocks.push({
            name: blockDef.name,
            selector,
            element,
            section: blockDef.section || null
          });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_home_default = {
    transform: (payload) => {
      const {
        document: document2,
        url,
        html,
        params
      } = payload;
      const main = document2.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document2, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = parsers[block.name];
        if (parser) {
          try {
            parser(block.element, { document: document2, url, params });
          } catch (e) {
            console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
          }
        } else {
          console.warn(`No parser found for block: ${block.name}`);
        }
      });
      executeTransformers("afterTransform", main, payload);
      const hr = document2.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document2);
      WebImporter.rules.transformBackgroundImages(main, document2);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: {
          title: document2.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_home_exports);
})();
