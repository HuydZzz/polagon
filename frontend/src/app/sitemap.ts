import type { MetadataRoute } from "next";

const SITE = "https://polagon.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${SITE}/`, lastModified: now, priority: 1.0 },
    { url: `${SITE}/markets`, lastModified: now, priority: 0.9 },
    { url: `${SITE}/polls`, lastModified: now, priority: 0.8 },
    { url: `${SITE}/leaderboard`, lastModified: now, priority: 0.7 },
    { url: `${SITE}/integrate`, lastModified: now, priority: 0.9 },
    { url: `${SITE}/profile`, lastModified: now, priority: 0.5 },
    { url: `${SITE}/create`, lastModified: now, priority: 0.6 },
  ];
}
