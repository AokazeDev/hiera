import type { MetadataRoute } from "next";

const routes = [
  "",
  "/studio",
  "/guia/permisos",
  "/catalogos",
  "/catalogos/authme-reloaded",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: `https://hiera.symera.cloud${route}`,
    lastModified: new Date("2026-07-29"),
  }));
}
