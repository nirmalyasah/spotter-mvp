import "./globals.css";

export const metadata = { title: "Spotter", description: "Your AI gym buddy" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
