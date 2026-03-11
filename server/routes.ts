import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

const PEXELS_API_KEY = process.env.PEXELS_API_KEY || "";

const DESTINATION_QUERIES: Record<string, string> = {};

// Pinned Pexels video IDs — one per destination
const PINNED_VIDEO_IDS: Record<string, number> = {
  "Taj Mahal": 36518778,
  "Udaipur":   6981411,
  "Ladakh":    5379990,
};

const videoCache: Record<string, string> = {};

async function fetchPexelsVideoById(id: number): Promise<string | null> {
  if (!PEXELS_API_KEY) return null;
  try {
    const res = await fetch(`https://api.pexels.com/videos/videos/${id}`, {
      headers: { Authorization: PEXELS_API_KEY },
    });
    if (!res.ok) return null;
    const video: any = await res.json();
    const files: any[] = (video.video_files || []).filter((f: any) => f.file_type === "video/mp4");
    if (!files.length) return null;
    // Prefer "hd" quality tag; if absent, pick the highest-resolution file
    const hd = files.find((f: any) => f.quality === "hd")
            || files.sort((a: any, b: any) => (b.width || 0) - (a.width || 0))[0];
    return hd?.link ?? null;
  } catch {
    return null;
  }
}

async function fetchPexelsVideo(query: string): Promise<string | null> {
  if (!PEXELS_API_KEY) return null;
  try {
    const url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape&size=large`;
    const res = await fetch(url, { headers: { Authorization: PEXELS_API_KEY } });
    if (!res.ok) return null;
    const data: any = await res.json();
    const videos: any[] = data.videos || [];
    for (const video of videos) {
      const files: any[] = video.video_files || [];
      const hd = files.find((f: any) => f.quality === "hd" && f.file_type === "video/mp4")
              || files.find((f: any) => f.file_type === "video/mp4");
      if (hd?.link) return hd.link;
    }
    return null;
  } catch {
    return null;
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get("/api/hero-videos", async (_req, res) => {
    if (!PEXELS_API_KEY) {
      return res.status(503).json({ error: "PEXELS_API_KEY not configured" });
    }

    const results: Record<string, string | null> = {};

    const pinnedEntries = Object.entries(PINNED_VIDEO_IDS).map(
      async ([dest, id]) => {
        if (videoCache[dest]) { results[dest] = videoCache[dest]; return; }
        const url = await fetchPexelsVideoById(id);
        if (url) videoCache[dest] = url;
        results[dest] = url;
      }
    );

    const searchEntries = Object.entries(DESTINATION_QUERIES).map(
      async ([dest, query]) => {
        if (videoCache[dest]) { results[dest] = videoCache[dest]; return; }
        const url = await fetchPexelsVideo(query);
        if (url) videoCache[dest] = url;
        results[dest] = url;
      }
    );

    await Promise.all([...pinnedEntries, ...searchEntries]);

    res.json(results);
  });

  return httpServer;
}
