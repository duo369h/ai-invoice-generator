import { readdirSync, statSync } from "fs";
import path from "path";
import { coreMoneyPagePaths, matrixSeoPaths, programmaticSeoPaths, templateIndustrySlugs } from "./lib/seo-data";
import { blogSeoSlugs } from "./lib/blog-data";
import { getSiteUrl } from "./lib/config";

const APP_DIR = path.join(process.cwd(), "src/app");
const EXCLUDED_STATIC_SEGMENTS = new Set([
  "api",
  "auth",
  "dashboard",
  "design-system",
  "portal",
  "rss.xml",
]);
const EXCLUDED_STATIC_ROUTES = new Set(["/favicon.ico"]);
const PUBLIC_FREELANCER_CATEGORY_SLUGS = [
  "designers",
  "developers",
  "writers",
  "consultants",
  "marketers",
];

function isRouteGroup(segment) {
  return segment.startsWith("(") && segment.endsWith(")");
}

function isDynamicSegment(segment) {
  return segment.startsWith("[") && segment.endsWith("]");
}

function normalizeRoute(segments) {
  const visibleSegments = segments.filter((segment) => !isRouteGroup(segment));
  return visibleSegments.length ? `/${visibleSegments.join("/")}` : "/";
}

function discoverStaticPublicRoutes(dir = APP_DIR, segments = []) {
  const routes = [];
  const entries = readdirSync(dir, { withFileTypes: true });
  const hasPage = entries.some((entry) => entry.isFile() && entry.name === "page.js");

  if (hasPage) {
    const route = normalizeRoute(segments);
    if (!EXCLUDED_STATIC_ROUTES.has(route)) {
      routes.push(route);
    }
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith("_")) continue;
    if (entry.name.startsWith(".")) continue;
    if (isDynamicSegment(entry.name)) continue;
    if (EXCLUDED_STATIC_SEGMENTS.has(entry.name)) continue;

    const entryPath = path.join(dir, entry.name);
    if (!statSync(entryPath).isDirectory()) continue;
    routes.push(...discoverStaticPublicRoutes(entryPath, [...segments, entry.name]));
  }

  return routes;
}

function toSitemapEntry(baseUrl, route, priority = 0.7, changeFrequency = "weekly") {
  return {
    url: route === "/" ? baseUrl : `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  };
}

export default function sitemap() {
  const baseUrl = getSiteUrl();
  const staticPublicRoutes = discoverStaticPublicRoutes();

  const templateUrls = templateIndustrySlugs.flatMap((industry) => [
    `/invoice-template/${industry}`,
    `/quote-template/${industry}`,
  ]);

  const dynamicPublicRoutes = [
    ...templateUrls,
    ...programmaticSeoPaths,
    ...matrixSeoPaths,
    ...blogSeoSlugs.map((slug) => `/blog/${slug}`),
    ...PUBLIC_FREELANCER_CATEGORY_SLUGS.map((slug) => `/freelancers/${slug}`),
  ];

  const routes = Array.from(new Set([...staticPublicRoutes, ...dynamicPublicRoutes])).sort();

  return routes.map((route) => {
    if (route === "/") return toSitemapEntry(baseUrl, route, 1.0);
    if (coreMoneyPagePaths.includes(route)) return toSitemapEntry(baseUrl, route, 0.95);
    if (route.startsWith("/invoice-generator/") || route.startsWith("/quote-generator/")) {
      return toSitemapEntry(baseUrl, route, 0.9);
    }
    if (route.startsWith("/invoice-template/") || route.startsWith("/quote-template/")) {
      return toSitemapEntry(baseUrl, route, 0.85);
    }
    if (route === "/pricing") return toSitemapEntry(baseUrl, route, 0.8);
    if (route.startsWith("/blog/")) return toSitemapEntry(baseUrl, route, 0.6, "monthly");
    if (route === "/privacy" || route === "/terms" || route === "/refund-policy") {
      return toSitemapEntry(baseUrl, route, 0.3, "monthly");
    }
    return toSitemapEntry(baseUrl, route);
  });
}
