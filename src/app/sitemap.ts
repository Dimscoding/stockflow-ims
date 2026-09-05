import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap { return [{ url: "https://stockflow-ims.vercel.app", lastModified: new Date(), changeFrequency: "monthly", priority: 1 }]; }
