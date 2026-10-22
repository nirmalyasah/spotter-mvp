import "./globals.css";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: { default: "Spotter — your AI gym buddy", template: "%s · Spotter" },
  description: "Spotter tells beginners exactly what to do at the gym: which machine, how to set it up, how much weight, and how to come back after a missed week.",
  applicationName: "Spotter",
  openGraph: { title: "Spotter — your AI gym buddy", description: "Stop guessing at the gym. Get your next exercise, set up and weight.", type: "website" },
};
export const viewport: Viewport = { themeColor: "#059669", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
