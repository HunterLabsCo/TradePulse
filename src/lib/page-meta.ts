const SITE_ORIGIN = "https://www.tradepulseapp.io";

type PageMeta = {
  title: string;
  description: string;
  /** Absolute path beginning with "/" — e.g. "/about". */
  path: string;
  /** Optional absolute path to a per-route social image (defaults to the site OG image). */
  ogImage?: string;
  ogImageAlt?: string;
};

function setMetaTag(selector: string, attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

/**
 * Sets per-page title, description and canonical so each public route ships
 * correct SEO metadata. The build-time prerender (scripts/prerender.mjs)
 * snapshots the DOM after this runs, baking these values into static HTML.
 */
export function setPageMeta({ title, description, path, ogImage, ogImageAlt }: PageMeta) {
  const canonical = `${SITE_ORIGIN}${path}`;

  document.title = title;
  setMetaTag('meta[name="description"]', "name", "description", description);
  setMetaTag('meta[property="og:title"]', "property", "og:title", title);
  setMetaTag('meta[property="og:description"]', "property", "og:description", description);
  setMetaTag('meta[property="og:url"]', "property", "og:url", canonical);
  setMetaTag('meta[name="twitter:title"]', "name", "twitter:title", title);
  setMetaTag('meta[name="twitter:description"]', "name", "twitter:description", description);

  if (ogImage) {
    const imageUrl = ogImage.startsWith("http") ? ogImage : `${SITE_ORIGIN}${ogImage}`;
    setMetaTag('meta[property="og:image"]', "property", "og:image", imageUrl);
    setMetaTag('meta[name="twitter:image"]', "name", "twitter:image", imageUrl);
    if (ogImageAlt) setMetaTag('meta[property="og:image:alt"]', "property", "og:image:alt", ogImageAlt);
  }

  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", canonical);
}
