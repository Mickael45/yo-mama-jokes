// Helpers that build schema.org JSON-LD objects, emitted on every page via the
// <Seo> component. Note: Google removed HowTo rich results (2024-2025) and
// stopped showing FAQ rich results for non-gov/health sites (May 2026), so we
// emit no HowTo schema at all. FAQPage is kept purely for AI/GEO parsing — not
// for SERP rich results. BreadcrumbList and the ItemList/CollectionPage types
// remain useful for classic SEO. Validate with a schema.org/JSON-LD linter
// (not Google's deprecated Rich Results Test).

import {
  SITE_URL,
  SITE_NAME,
  SITE_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  absoluteUrl,
} from "./siteConfig";

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/favicon.ico`,
    description: SITE_DESCRIPTION,
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    inLanguage: "en-US",
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
}

/** A breadcrumb trail. Pass [{ name, path }, ...] from root to current page. */
export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

/** A list of jokes (plain strings) modelled as a CollectionPage + ItemList. */
export function jokeCollectionSchema(opts: {
  name: string;
  description: string;
  path: string;
  jokes: string[];
  dateModified?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: opts.name,
    description: opts.description,
    url: absoluteUrl(opts.path),
    isPartOf: { "@id": `${SITE_URL}/#website` },
    primaryImageOfPage: DEFAULT_OG_IMAGE,
    ...(opts.dateModified ? { dateModified: opts.dateModified } : {}),
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: opts.jokes.length,
      itemListElement: opts.jokes.map((joke, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "CreativeWork",
          "@id": `${absoluteUrl(opts.path)}#joke-${i + 1}`,
          name: `${opts.name} #${i + 1}`,
          text: joke,
          genre: "Yo Mama Joke",
        },
      })),
    },
  };
}

export type FaqItem = { question: string; answer: string };

// Retained for AI answer engines / GEO citation only. FAQ rich results no
// longer appear in Google SERPs for sites like this; the visible FAQ content
// is what earns long-tail traffic and AI citations.
export function faqSchema(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}
