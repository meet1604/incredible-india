import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { HotspotMarker } from "./HotspotMarker";
import { type SiteSettings, type Hotspot } from "@shared/schema";
import { getVimeoEmbedUrl, isDirectVideoSource, isVimeoUrl } from "@/lib/media";
import { loadVimeoPlayerApi, type VimeoPlayer } from "@/lib/vimeo";

interface HeroProps {
  settings: SiteSettings;
  hotspots: Hotspot[];
}

export function Hero({ settings, hotspots }: HeroProps) {
  const [videoTime, setVideoTime] = useState(0);
  const [hoverActive, setHoverActive] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const vimeoIframeRef = useRef<HTMLIFrameElement>(null);
  const vimeoPlayerRef = useRef<VimeoPlayer | null>(null);
  const pxVideoBgRef = useRef<HTMLDivElement>(null);
  const isVimeo = isVimeoUrl(settings.heroVideoUrl);
  const vimeoEmbedUrl = getVimeoEmbedUrl(settings.heroVideoUrl);
  const isDirectVideo = isDirectVideoSource(settings.heroVideoUrl);

  // Reset error when URL changes
  useEffect(() => {
    setVideoError(false);
  }, [settings.heroVideoUrl]);

  // Mouse pan effect
  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const videoBg = pxVideoBgRef.current;
    if (!videoBg) return;

    let curX = 0, curY = 0;
    let tgtX = 0, tgtY = 0;
    let rafId: number;
    const DAMPING = 0.92;

    const tick = (ts: number) => {
      const factor = 1 - Math.pow(DAMPING, 16.67 / 16.67);
      curX += (tgtX - curX) * factor;
      curY += (tgtY - curY) * factor;
      videoBg.style.transform = `translate3d(${curX}px, ${curY}px, 0) scale(1.15)`;
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    const onMouseMove = (e: MouseEvent) => {
      const x = e.clientX / window.innerWidth - 0.5;
      const y = e.clientY / window.innerHeight - 0.5;
      tgtX = -x * 200;
      tgtY = -y * 200;
    };

    window.addEventListener("mousemove", onMouseMove);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  // Track video time
  useEffect(() => {
    if (isVimeo) return;
    const interval = setInterval(() => {
      if (videoRef.current) {
        setVideoTime(videoRef.current.currentTime);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [isVimeo]);

  useEffect(() => {
    if (!isVimeo || !vimeoIframeRef.current) return;

    let cancelled = false;
    let handleTimeUpdate: ((payload?: { seconds?: number }) => void) | null = null;

    loadVimeoPlayerApi()
      .then(() => {
        if (cancelled || !window.Vimeo?.Player || !vimeoIframeRef.current) return;

        const player = new window.Vimeo.Player(vimeoIframeRef.current);
        vimeoPlayerRef.current = player;
        handleTimeUpdate = (payload?: { seconds?: number }) => {
          setVideoTime(payload?.seconds ?? 0);
        };

        player.on("timeupdate", handleTimeUpdate);
        player.play().catch(() => setVideoError(true));
      })
      .catch(() => setVideoError(true));

    return () => {
      cancelled = true;
      if (handleTimeUpdate && vimeoPlayerRef.current) {
        vimeoPlayerRef.current.off("timeupdate", handleTimeUpdate);
      }
      vimeoPlayerRef.current = null;
    };
  }, [isVimeo, settings.heroVideoUrl]);

  const activeSpot = hotspots.find(h => videoTime >= h.timeStart && videoTime <= h.timeEnd);

  return (
    <section className="relative w-full h-screen overflow-hidden bg-black">
      <div ref={pxVideoBgRef} className="absolute inset-0 transition-opacity duration-1000">
        {settings.heroMediaType === "video" ? (
          isVimeo && vimeoEmbedUrl ? (
            <iframe
              ref={vimeoIframeRef}
              src={vimeoEmbedUrl}
              className="absolute inset-0 h-full w-full scale-[1.15] pointer-events-none"
              allow="autoplay; fullscreen; picture-in-picture"
              title="Hero background video"
            />
          ) : !videoError && isDirectVideo ? (
            <video
              ref={videoRef}
              src={settings.heroVideoUrl}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              onError={() => setVideoError(true)}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
              <div className="text-center p-8">
                <p className="text-white/40 font-montserrat text-xs tracking-widest uppercase mb-4">Video failed to load</p>
                <p className="text-white/20 text-[10px] max-w-xs mx-auto">
                  Use a direct video file URL or a Vimeo link such as `https://vimeo.com/123456789`.
                </p>
              </div>
            </div>
          )
        ) : (
          <img 
            src={settings.heroImageUrl} 
            alt="Hero Background"
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
      </div>

      <AnimatePresence>
        {activeSpot && (
          <HotspotMarker 
              key={activeSpot.id}
              hotspot={activeSpot}
              onHoverChange={(hovering) => {
                setHoverActive(hovering);
                if (isVimeo) {
                  if (hovering) vimeoPlayerRef.current?.pause();
                  else vimeoPlayerRef.current?.play().catch(() => undefined);
                } else {
                  if (hovering) videoRef.current?.pause();
                  else videoRef.current?.play();
                }
              }}
            />
          )}
      </AnimatePresence>

      <div className="absolute bottom-12 left-8 md:left-16 z-30">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-3"
        >
          {settings.showHeroDescription && (
            <div className="font-montserrat text-white/50 text-[10px] tracking-[0.3em] uppercase">
              {settings.heroDescription}
            </div>
          )}
          
          {(settings.showHeroTitle || settings.showHeroSubtitle) && (
            <h2 className="font-cinzel text-white text-4xl md:text-6xl font-bold tracking-wider leading-tight">
              {settings.showHeroTitle && settings.heroTitle}
              {settings.showHeroTitle && settings.showHeroSubtitle && <br />}
              {settings.showHeroSubtitle && (
                <span style={{ WebkitTextFillColor: "transparent", WebkitTextStroke: "1px rgba(255,255,255,0.4)" }}>
                  {settings.heroSubtitle}
                </span>
              )}
            </h2>
          )}
        </motion.div>
      </div>

      <div className="absolute bottom-12 right-8 md:right-12 z-30 flex flex-col items-center gap-2">
        <span className="font-montserrat text-white/40 text-[9px] tracking-[0.3em] uppercase rotate-90 origin-center translate-x-2 mb-4">Scroll</span>
        <div className="w-px h-12 bg-white/20 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full bg-white/70 h-1/2 animate-bounce" />
        </div>
        <ChevronDown className="w-4 h-4 text-white/40 animate-bounce" />
      </div>
    </section>
  );
}
