import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "American Mortgage | Home Loans Made Simple",
  description: "Get the best mortgage rates with American Mortgage. FHA, Conventional, VA, and USDA loans available. Apply online today!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
