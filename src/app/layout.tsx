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
  const metaPixelId = seoSettings?.metaPixelId;

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
        {metaPixelId && (
          <Script id="meta-pixel" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${metaPixelId}');
              fbq('track', 'PageView');
            `}
          </Script>
        )}
      </head>
      <body>{children}</body>
    </html>
  );
}
