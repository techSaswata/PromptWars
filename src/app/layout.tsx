import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LEXGUARD | AI Rights & Contract Intelligence",
  description: "AI contract risk cockpit for clause extraction, adversarial reasoning, and negotiation strategy."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
