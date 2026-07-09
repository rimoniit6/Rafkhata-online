import type { Metadata } from "next";
import { Suspense } from "react";
import AppShell from "@/components/layout/AppShell";
import HomePage from "@/components/home/HomePage";

export const metadata: Metadata = {
  title: "শিক্ষা বাংলা - বাংলাদেশের সেরা শিক্ষা প্ল্যাটফর্ম",
  description:
    "Class 6 থেকে HSC পর্যন্ত সকল বিষয়ের লেকচার, MCQ, সৃজনশীল প্রশ্ন ও বোর্ড প্রশ্ন। বাংলাদেশের সেরা অনলাইন শিক্ষা প্ল্যাটফর্ম।",
  keywords: [
    "শিক্ষা বাংলা",
    "অনলাইন শিক্ষা",
    "MCQ",
    "বোর্ড প্রশ্ন",
    "HSC",
    "SSC",
    "বাংলাদেশ",
  ],
  openGraph: {
    title: "শিক্ষা বাংলা - বাংলাদেশের সেরা শিক্ষা প্ল্যাটফর্ম",
    description:
      "Class 6 থেকে HSC পর্যন্ত সকল বিষয়ের লেকচার, MCQ, সৃজনশীল প্রশ্ন ও বোর্ড প্রশ্ন। বাংলাদেশের সেরা অনলাইন শিক্ষা প্ল্যাটফর্ম।",
    url: "/",
    siteName: "শিক্ষা বাংলা",
    locale: "bn_BD",
    type: "website",
    images: [{ url: "/icon-512.png", width: 512, height: 512 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "শিক্ষা বাংলা - বাংলাদেশের সেরা শিক্ষা প্ল্যাটফর্ম",
    description:
      "Class 6 থেকে HSC পর্যন্ত সকল বিষয়ের লেকচার, MCQ, সৃজনশীল প্রশ্ন ও বোর্ড প্রশ্ন। বাংলাদেশের সেরা অনলাইন শিক্ষা প্ল্যাটফর্ম।",
    images: ["/icon-512.png"],
  },
};

export default function Home() {
  return (
    <AppShell>
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        }
      >
        <HomePage />
      </Suspense>
    </AppShell>
  );
}
