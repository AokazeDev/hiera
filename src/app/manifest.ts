import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hiera",
    short_name: "Hiera",
    description: "Editor local-first de backups JSON de LuckPerms.",
    start_url: "/",
    display: "standalone",
    background_color: "#e8e5dd",
    theme_color: "#e8e5dd",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
