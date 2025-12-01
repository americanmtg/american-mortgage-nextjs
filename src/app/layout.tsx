import type { Metadata } from "next";
import "./globals.css";
import { getSeoSettings, getMediaUrl, getAbsoluteMediaUrl } from "@/lib/data";
import Script from "next/script";

export async function generateMetadata(): Promise<Metadata> {
  const seoSettings = await getSeoSettings();

  const faviconUrl = getMediaUrl(seoSettings?.favicon);
  // OG images need absolute URLs so external services can fetch them
  const ogImageUrl = getAbsoluteMediaUrl(seoSettings?.ogImage);

  return {
    title: seoSettings?.siteTitle || "American Mortgage | Home Loans Made Simple",
    description: seoSettings?.metaDescription || "Get the best mortgage rates with American Mortgage. FHA, Conventional, VA, and USDA loans available. Apply online today!",
    keywords: seoSettings?.metaKeywords || undefined,
    icons: faviconUrl ? { icon: faviconUrl } : undefined,
    openGraph: {
      title: seoSettings?.ogTitle || seoSettings?.siteTitle || "American Mortgage | Home Loans Made Simple",
      description: seoSettings?.ogDescription || seoSettings?.metaDescription || "Get the best mortgage rates with American Mortgage.",
      images: ogImageUrl ? [{ url: ogImageUrl, width: 1200, height: 630 }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: seoSettings?.ogTitle || seoSettings?.siteTitle || "American Mortgage",
      description: seoSettings?.ogDescription || seoSettings?.metaDescription || "Get the best mortgage rates with American Mortgage.",
      images: ogImageUrl ? [ogImageUrl] : undefined,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const seoSettings = await getSeoSettings();
  const gaId = seoSettings?.googleAnalyticsId;

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&family=Open+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}');
              `}
            </Script>
          </>
        )}
      </head>
      <body>{children}</body>
    </html>
  );
}
