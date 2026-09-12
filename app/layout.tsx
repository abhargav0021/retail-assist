import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Retail Assist — Cedar & Bolt Hardware",
  description: "AI support assistant demo for a fictional hardware chain.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
