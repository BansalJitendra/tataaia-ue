/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import accordionListParser from './parsers/accordion-list.js';
import cardsArticleParser from './parsers/cards-article.js';
import cardsAwardParser from './parsers/cards-award.js';
import cardsPersonaParser from './parsers/cards-persona.js';
import cardsPlanParser from './parsers/cards-plan.js';
import cardsPromoParser from './parsers/cards-promo.js';
import cardsQuicklinkParser from './parsers/cards-quicklink.js';
import cardsStatsParser from './parsers/cards-stats.js';
import carouselBannerParser from './parsers/carousel-banner.js';
import carouselReviewParser from './parsers/carousel-review.js';
import carouselVideoParser from './parsers/carousel-video.js';
import columnsPanelsParser from './parsers/columns-panels.js';
import formParser from './parsers/form.js';
import heroBannerParser from './parsers/hero-banner.js';
import heroPromoParser from './parsers/hero-promo.js';
import quoteCalloutParser from './parsers/quote-callout.js';
import tableDataParser from './parsers/table-data.js';
import tabsLinksParser from './parsers/tabs-links.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/tataaia-cleanup.js';
import sectionsTransformer from './transformers/tataaia-sections.js';

// PARSER REGISTRY
const parsers = {
  'accordion-list': accordionListParser,
  'cards-article': cardsArticleParser,
  'cards-award': cardsAwardParser,
  'cards-persona': cardsPersonaParser,
  'cards-plan': cardsPlanParser,
  'cards-promo': cardsPromoParser,
  'cards-quicklink': cardsQuicklinkParser,
  'cards-stats': cardsStatsParser,
  'carousel-banner': carouselBannerParser,
  'carousel-review': carouselReviewParser,
  'carousel-video': carouselVideoParser,
  'columns-panels': columnsPanelsParser,
  'form': formParser,
  'hero-banner': heroBannerParser,
  'hero-promo': heroPromoParser,
  'quote-callout': quoteCalloutParser,
  'table-data': tableDataParser,
  'tabs-links': tabsLinksParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
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
      "id": "s13",
      "name": "IRDAI Bima Bharosa banner",
      "selector": [
        ".banner-asset-container"
      ],
      "style": null,
      "blocks": [
        "hero-banner"
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

// TRANSFORMER REGISTRY - cleanup first, sections last (adds <hr> boundaries + metadata)
const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
];

/**
 * Execute all page transformers for a specific hook.
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration.
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      let elements = [];
      try {
        elements = document.querySelectorAll(selector);
      } catch (e) {
        console.warn(`Invalid selector for "${blockDef.name}": ${selector}`);
        return;
      }
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        pageBlocks.push({
          name: blockDef.name, selector, element, section: blockDef.section || null,
        });
      });
    });
  });
  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const {
      document, url, html, params,
    } = payload;

    const main = document.body;

    // 1. beforeTransform cleanup
    executeTransformers('beforeTransform', main, payload);

    // 2. Discover blocks
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block (skip elements already replaced by an earlier parser)
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. afterTransform cleanup + section breaks/metadata
    executeTransformers('afterTransform', main, payload);

    // 5. WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Sanitized path — map the homepage root URL to /index
    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
