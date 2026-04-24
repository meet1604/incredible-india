import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { insertSiteSettingsSchema, insertHotspotSchema, insertRecipeSchema } from "@shared/schema";
import fs from "fs";
import path from "path";
import { spawn } from "child_process";

const publicDir = path.resolve(process.cwd(), "client/public");
const videoContentTypes: Record<string, string> = {
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".ogg": "video/ogg",
};

function normalizeVideoInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";

  if (trimmed.startsWith("<iframe")) {
    const match = trimmed.match(/src=["']([^"']+)["']/i);
    return match?.[1] ?? trimmed;
  }

  return trimmed;
}

function resolvePythonCommand() {
  return process.platform === "win32" ? "python" : "python3";
}

function canGracefullySkipSceneDetection(detail: string) {
  return /python was not found|could not find .* in path|modulenotfounderror|no module named/i.test(detail);
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Video upload — streams body directly to public dir
  app.post("/api/upload-video", (req, res) => {
    const raw = (req.headers["x-filename"] as string) || "hero-video.mp4";
    const safe = path.basename(raw).replace(/[^a-zA-Z0-9._\- ]/g, "_");
    const filePath = path.join(publicDir, safe);
    const writeStream = fs.createWriteStream(filePath);
    req.pipe(writeStream);
    writeStream.on("finish", () => res.json({ url: `/${safe}`, filename: safe }));
    writeStream.on("error", () => res.status(500).json({ error: "Upload failed" }));
    req.on("error", () => writeStream.destroy());
  });

  // Scene detection — runs Python script on the current hero video
  app.post("/api/detect-scenes", async (req, res) => {
    const settings = await storage.getSiteSettings();
    const videoUrl = settings.heroVideoUrl || "";
    const filename = decodeURIComponent(videoUrl.replace(/^\//, ""));
    const videoPath = path.join(publicDir, filename);
    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({ error: "Video file not found on server" });
    }
    const thumbDir = path.join(publicDir, "thumbnails");
    const scriptPath = path.resolve("script/detect-scenes.py");
    const py = spawn(resolvePythonCommand(), [scriptPath, videoPath, thumbDir, "22"]);
    let out = "", err = "";
    py.stdout.on("data", (d: Buffer) => (out += d.toString()));
    py.stderr.on("data", (d: Buffer) => (err += d.toString()));
    py.on("error", (error: Error & { code?: string }) => {
      console.error("Scene detection launcher error:", error);
      if (!res.headersSent) {
        const detail = error.code === "ENOENT"
          ? `Could not find ${resolvePythonCommand()} in PATH.`
          : error.message;

        if (canGracefullySkipSceneDetection(detail)) {
          return res.json([]);
        }

        res.status(500).json({
          error: "Scene detection is unavailable on this machine",
          detail,
        });
      }
    });
    py.on("close", (code: number) => {
      if (res.headersSent) return;
      if (code !== 0) {
        console.error("Scene detection error:", err);
        if (canGracefullySkipSceneDetection(err)) {
          return res.json([]);
        }
        return res.status(500).json({ error: "Detection failed", detail: err });
      }
      try {
        res.json(JSON.parse(out));
      } catch {
        res.status(500).json({ error: "Could not parse detection output" });
      }
    });
  });

  // Video streaming with range request support
  app.get(/.*\.(mp4|webm|ogg)$/i, (req, res) => {
    const relativePath = decodeURIComponent(req.path).replace(/^[/\\]+/, "");
    const filePath = path.resolve(publicDir, relativePath);
    if (!filePath.startsWith(publicDir)) return res.status(403).end();
    if (!fs.existsSync(filePath)) return res.status(404).end();

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;
    const contentType = videoContentTypes[path.extname(filePath).toLowerCase()] ?? "application/octet-stream";

    if (range) {
      const [startStr, endStr] = range.replace(/bytes=/, "").split("-");
      const parsedStart = parseInt(startStr, 10);
      const parsedEnd = endStr ? parseInt(endStr, 10) : fileSize - 1;
      const start = Number.isNaN(parsedStart) ? 0 : parsedStart;
      const end = Number.isNaN(parsedEnd) ? fileSize - 1 : parsedEnd;

      if (start < 0 || end < start || start >= fileSize) {
        res.writeHead(416, { "Content-Range": `bytes */${fileSize}` });
        return res.end();
      }

      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": end - start + 1,
        "Content-Type": contentType,
      });
      fs.createReadStream(filePath, { start, end }).pipe(res);
    } else {
      res.writeHead(200, {
        "Accept-Ranges": "bytes",
        "Content-Length": fileSize,
        "Content-Type": contentType,
      });
      fs.createReadStream(filePath).pipe(res);
    }
  });

  // Site Settings
  app.get("/api/site-settings", async (_req, res) => {
    const settings = await storage.getSiteSettings();
    res.json(settings);
  });

  app.patch("/api/site-settings", async (req, res) => {
    const parsed = insertSiteSettingsSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    
    let data = { ...parsed.data };

    if (typeof data.heroVideoUrl === "string") {
      data.heroVideoUrl = normalizeVideoInput(data.heroVideoUrl);
    }

    // Auto-resolve Pexels URLs if API key is present
    if (data.heroVideoUrl && data.heroVideoUrl.includes("pexels.com/video") && process.env.PEXELS_API_KEY) {
      try {
        const videoId = data.heroVideoUrl.split("-").pop()?.replace("/", "");
        if (videoId) {
          const response = await fetch(`https://api.pexels.com/videos/videos/${videoId}`, {
            headers: { Authorization: process.env.PEXELS_API_KEY }
          });
          if (response.ok) {
            const videoData: any = await response.json();
            // Find the best quality MP4 (prefer UHD/4K, then HD)
            const bestFile = videoData.video_files.find((f: any) => f.file_type === "video/mp4" && f.quality === "uhd")
                          || videoData.video_files.find((f: any) => f.file_type === "video/mp4" && f.quality === "hd")
                          || videoData.video_files[0];
            if (bestFile) {
              data.heroVideoUrl = bestFile.link;
            }
          }
        }
      } catch (error) {
        console.error("Failed to resolve Pexels video:", error);
      }
    }

    const current = await storage.getSiteSettings();
    const updated = await storage.updateSiteSettings({ ...current, ...data });
    res.json(updated);
  });

  // Hotspots
  app.get("/api/hotspots", async (_req, res) => {
    const hotspots = await storage.getHotspots();
    res.json(hotspots);
  });

  app.post("/api/hotspots", async (req, res) => {
    const parsed = insertHotspotSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const hotspot = await storage.createHotspot(parsed.data);
    res.json(hotspot);
  });

  app.patch("/api/hotspots/:id", async (req, res) => {
    const parsed = insertHotspotSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const current = (await storage.getHotspots()).find(h => h.id === req.params.id);
    if (!current) return res.status(404).json({ error: "Hotspot not found" });
    const updated = await storage.updateHotspot(req.params.id, { ...current, ...parsed.data });
    res.json(updated);
  });

  app.delete("/api/hotspots/:id", async (req, res) => {
    await storage.deleteHotspot(req.params.id);
    res.status(204).end();
  });

  // Recipes
  app.get("/api/recipes", async (_req, res) => {
    const recipes = await storage.getRecipes();
    res.json(recipes);
  });

  app.post("/api/recipes", async (req, res) => {
    const parsed = insertRecipeSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const recipe = await storage.createRecipe(parsed.data);
    res.json(recipe);
  });

  app.patch("/api/recipes/:id", async (req, res) => {
    const parsed = insertRecipeSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const current = (await storage.getRecipes()).find(r => r.id === req.params.id);
    if (!current) return res.status(404).json({ error: "Recipe not found" });
    const updated = await storage.updateRecipe(req.params.id, { ...current, ...parsed.data });
    res.json(updated);
  });

  app.delete("/api/recipes/:id", async (req, res) => {
    await storage.deleteRecipe(req.params.id);
    res.status(204).end();
  });

  return httpServer;
}
