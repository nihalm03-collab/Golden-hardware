import type { Metadata } from "next";
import "./globals.css";
import { ConditionalAppShell } from "@/components/ConditionalAppShell";

export const metadata: Metadata = {
  title: "Golden Hardwares",
  description: "Simple inventory and billing dashboard for Golden Hardwares.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <ConditionalAppShell>{children}</ConditionalAppShell>
      </body>
    </html>
  );
}
