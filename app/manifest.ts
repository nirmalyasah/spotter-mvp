import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Spotter — your AI gym buddy", short_name: "Spotter", description: "Know exactly what to do at the gym.",
    start_url: "/app", display: "standalone", background_color: "#f8faf9", theme_color: "#059669",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
