import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Spryon — Restaurant Digital Menu",
  description: "Spryon admin dashboard for managing your restaurant digital menu.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
