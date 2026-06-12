import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import QueryProvider from "@/providers/QueryProvider";
import AuthProvider from "@/providers/AuthProvider";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import DynamicFavicon from "@/components/shared/DynamicFavicon";
import ApiErrorHandler from "@/components/shared/ApiErrorHandler";
import GlobalStructuredData from "@/components/shared/JsonLd";
import { db } from '@/lib/db'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

// Default values as fallback
const DEFAULT_SEO = {
  title: "শিক্ষা বাংলা - বাংলাদেশের সেরা শিক্ষা প্ল্যাটফর্ম",
  description: "Class 6 থেকে HSC পর্যন্ত সকল বিষয়ের লেকচার, MCQ, সৃজনশীল প্রশ্ন ও বোর্ড প্রশ্ন। বাংলাদেশের সেরা অনলাইন শিক্ষা প্ল্যাটফর্ম।",
  keywords: "শিক্ষা বাংলা,অনলাইন শিক্ষা,MCQ,বোর্ড প্রশ্ন,HSC,SSC,বাংলাদেশ",
  author: "শিক্ষা বাংলা",
}

const getSeoSettings = unstable_cache(
  async () => {
    try {
      const settings = await db.siteSetting.findMany({
        where: { group: 'seo' },
        select: { key: true, value: true },
      })
      const map = Object.fromEntries(settings.map(s => [s.key, s.value]))
      return {
        title: map['seo_title'] || DEFAULT_SEO.title,
        description: map['seo_description'] || DEFAULT_SEO.description,
        keywords: map['seo_keywords'] || DEFAULT_SEO.keywords,
        author: map['seo_author'] || DEFAULT_SEO.author,
      }
    } catch {
      return DEFAULT_SEO
    }
  },
  ['seo-settings'],
  { revalidate: 300 }
)

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoSettings()
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://sikkhabangla.com'),
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords.split(','),
    authors: [{ name: seo.author }],
    icons: { icon: "/api/favicon", apple: "/apple-icon.png" },
    manifest: "/manifest.json",
    appleWebApp: { capable: true, title: "শিক্ষা বাংলা", statusBarStyle: "default" },
    openGraph: {
      title: seo.title,
      description: seo.description,
      url: '/',
      siteName: 'শিক্ষা বাংলা',
      locale: 'bn_BD',
      type: 'website',
      images: [{ url: '/icon-512.png', width: 512, height: 512 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.title,
      description: seo.description,
      images: ['/icon-512.png'],
    },
    robots: { index: true, follow: true },
    other: {
      'mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-status-bar-style': 'default',
    },
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#059669" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="শিক্ষা বাংলা" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        <link rel="preconnect" href="https://eylbmvqyrtkfcnfsienv.supabase.co" />
        <link rel="preconnect" href="https://utfs.io" />
        <link rel="dns-prefetch" href="https://eylbmvqyrtkfcnfsienv.supabase.co" />
        <link rel="dns-prefetch" href="https://utfs.io" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js')
                })
              }
              window.MathJax = {
                tex: {
                  inlineMath: [['$', '$'], ['\\\\(', '\\\\)']]
                },
                mml: {
                  displayAlign: 'center',
                  displayIndent: '0em'
                },
                options: {
                  skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre']
                },
                startup: {
                  pageReady: () => MathJax.startup.defaultPageReady()
                }
              };
              // Defer MathJax load to after first paint (reduces LCP blocking)
              window.addEventListener('load', () => {
                setTimeout(() => {
                  var s = document.createElement('script');
                  s.id = 'MathJax-script';
                  s.async = true;
                  s.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
                  document.head.appendChild(s);
                }, 2000);
              });
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <AuthProvider>
              <DynamicFavicon />
              <ApiErrorHandler />
              <GlobalStructuredData />
              {children}
            </AuthProvider>
            <Toaster />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
