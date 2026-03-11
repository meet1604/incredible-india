import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { X, ChevronDown } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const KERALA_CARDS = [
  {
    id: 1,
    title: "Kerala Backwaters",
    sub: "God's own waterways",
    img: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=700&q=85&auto=format&fit=crop",
    w: 260, h: 340,
  },
  {
    id: 2,
    title: "Kathakali Dance",
    sub: "Ancient classical art form",
    img: "https://images.unsplash.com/photo-1583316174775-bd6dc0e9f298?w=700&q=85&auto=format&fit=crop",
    w: 240, h: 300,
  },
  {
    id: 3,
    title: "Kerala Cuisine",
    sub: "Spices of the Malabar coast",
    img: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=700&q=85&auto=format&fit=crop",
    w: 240, h: 300,
  },
  {
    id: 4,
    title: "Munnar Tea Gardens",
    sub: "Emerald hills of the Western Ghats",
    img: "https://images.unsplash.com/photo-1582716401301-b2407dc7563d?w=700&q=85&auto=format&fit=crop",
    w: 270, h: 360,
  },
  {
    id: 5,
    title: "Kovalam Beaches",
    sub: "Crescent of golden sand",
    img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=700&q=85&auto=format&fit=crop",
    w: 280, h: 340,
  },
  {
    id: 6,
    title: "Kerala Temples",
    sub: "Five thousand years of faith",
    img: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=700&q=85&auto=format&fit=crop",
    w: 230, h: 290,
  },
];

const PAIRS = [
  [KERALA_CARDS[0], KERALA_CARDS[1]],
  [KERALA_CARDS[2], KERALA_CARDS[3]],
  [KERALA_CARDS[4], KERALA_CARDS[5]],
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function KeralaOverlay({ isOpen, onClose }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const scrollSectionRef = useRef<HTMLDivElement>(null);

  const pairWrapRefs = useRef<(HTMLDivElement | null)[]>([]);
  const leftCardRefs  = useRef<(HTMLDivElement | null)[]>([]);
  const rightCardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const stRef = useRef<ScrollTrigger | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const overlay = overlayRef.current;
    if (!overlay) return;

    overlay.scrollTop = 0;
    document.body.style.overflow = "hidden";

    gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: "power2.out" });

    const pw = pairWrapRefs.current;
    const lc = leftCardRefs.current;
    const rc = rightCardRefs.current;

    gsap.set(pw, { y: "70vh", opacity: 0 });
    gsap.set(lc, { x: 0 });
    gsap.set(rc, { x: 0 });

    ScrollTrigger.scrollerProxy(overlay, {
      scrollTop(value?: number) {
        if (arguments.length) overlay.scrollTop = value as number;
        return overlay.scrollTop;
      },
      getBoundingClientRect() {
        return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
      },
    });

    const onScroll = () => ScrollTrigger.update();
    overlay.addEventListener("scroll", onScroll, { passive: true });

    const tl = gsap.timeline({ paused: true });
    tlRef.current = tl;

    const addPair = (i: number, position: string | number) => {
      const wrap = pw[i], left = lc[i], right = rc[i];
      if (!wrap || !left || !right) return;

      tl.to(wrap, { y: "5vh", opacity: 1, duration: 1, ease: "power2.out" }, position);
      tl.to(left,  { x: "-35vw", y: "-10vh", duration: 1.5, ease: "power2.inOut" }, ">");
      tl.to(right, { x:  "35vw", y: "-10vh", duration: 1.5, ease: "power2.inOut" }, "<");
      tl.to(wrap,  { y: "-85vh", opacity: 0, duration: 1, ease: "power2.in" }, ">");
    };

    addPair(0, 0);
    addPair(1, "+=0.3");
    addPair(2, "+=0.3");

    const st = ScrollTrigger.create({
      trigger: scrollSectionRef.current,
      scroller: overlay,
      start: "top top",
      end: "bottom bottom",
      scrub: 1.5,
      onUpdate: (self) => {
        tl.progress(self.progress);
      },
    });
    stRef.current = st;

    return () => {
      overlay.removeEventListener("scroll", onScroll);
      st.kill();
      tl.kill();
      ScrollTrigger.getAll().forEach((s) => s.kill());
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleClose = () => {
    const overlay = overlayRef.current;
    if (overlay) {
      gsap.to(overlay, {
        opacity: 0,
        duration: 0.35,
        ease: "power2.in",
        onComplete: onClose,
      });
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      data-testid="kerala-overlay"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        overflowY: "auto",
        background: "#050505",
        opacity: 0,
      }}
    >
      {/* ── Close button (always on top) ── */}
      <button
        onClick={handleClose}
        data-testid="kerala-close"
        style={{
          position: "fixed",
          top: 24,
          right: 24,
          zIndex: 210,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.08)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.15)",
          cursor: "pointer",
          color: "white",
          transition: "background 0.2s ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.18)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
      >
        <X size={18} />
      </button>

      {/* ── Hero: 100vh ── */}
      <div style={{ position: "relative", height: "100vh", overflow: "hidden" }}>
        <img
          src="https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=1920&q=85&auto=format&fit=crop"
          alt="Kerala"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(5,5,5,0.7) 100%)" }} />

        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 24px" }}>
          <div
            className="font-montserrat uppercase text-white/50"
            style={{ fontSize: 10, letterSpacing: "0.45em", marginBottom: 20 }}
          >
            God's Own Country
          </div>

          <h1
            className="font-cinzel text-white font-bold"
            style={{ fontSize: "clamp(3rem, 8vw, 7rem)", letterSpacing: "0.04em", lineHeight: 1.05, marginBottom: 24 }}
          >
            Explore Kerala
          </h1>

          <div
            style={{ width: 60, height: 1, background: "linear-gradient(to right, transparent, rgba(255,255,255,0.5), transparent)", marginBottom: 28 }}
          />

          <p
            className="font-cormorant text-white/70 italic"
            style={{ fontSize: "clamp(1.1rem, 2.5vw, 1.5rem)", maxWidth: 560, lineHeight: 1.6 }}
          >
            Where emerald backwaters meet ancient temples, and spice-scented hills descend to crescent beaches of gold.
          </p>
        </div>

        {/* Scroll cue */}
        <div style={{ position: "absolute", bottom: 36, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <span className="font-montserrat text-white/30" style={{ fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase" }}>Scroll to explore</span>
          <ChevronDown size={16} color="rgba(255,255,255,0.3)" style={{ animation: "bounce 2s ease-in-out infinite" }} />
        </div>
      </div>

      {/* ── Scroll animation section: 400vh ── */}
      <div
        ref={scrollSectionRef}
        style={{ position: "relative", height: "400vh", background: "#050505" }}
      >
        {/* Sticky stage — CSS sticky, not GSAP pin */}
        <div
          style={{
            position: "sticky",
            top: 0,
            height: "100vh",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Section label */}
          <div style={{ position: "absolute", top: 36, left: "50%", transform: "translateX(-50%)", textAlign: "center" }}>
            <span className="font-montserrat text-white/20" style={{ fontSize: 9, letterSpacing: "0.4em", textTransform: "uppercase" }}>
              Discover Kerala
            </span>
          </div>

          {/* Card pairs — all stacked at center, animated via GSAP */}
          {PAIRS.map((pair, pi) => {
            const [cardL, cardR] = pair;
            const totalW = cardL.w + 8 + cardR.w;

            return (
              <div
                key={pi}
                ref={(el) => { pairWrapRefs.current[pi] = el; }}
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  marginLeft: -(totalW / 2),
                  marginTop: -(Math.max(cardL.h, cardR.h) / 2),
                  display: "flex",
                  gap: 8,
                  alignItems: "flex-start",
                }}
              >
                {/* Left card */}
                <div
                  ref={(el) => { leftCardRefs.current[pi] = el; }}
                  data-testid={`kerala-card-left-${pi}`}
                  style={{
                    width: cardL.w,
                    height: cardL.h,
                    borderRadius: 12,
                    overflow: "hidden",
                    boxShadow: "0 24px 60px rgba(0,0,0,0.7), 0 4px 20px rgba(0,0,0,0.5)",
                    position: "relative",
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={cardL.img}
                    alt={cardL.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 55%)" }} />
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "18px 16px" }}>
                    <div className="font-cinzel text-white font-semibold" style={{ fontSize: 13, letterSpacing: "0.05em", marginBottom: 4 }}>
                      {cardL.title}
                    </div>
                    <div className="font-montserrat text-white/55 uppercase" style={{ fontSize: 8, letterSpacing: "0.2em" }}>
                      {cardL.sub}
                    </div>
                  </div>
                </div>

                {/* Right card */}
                <div
                  ref={(el) => { rightCardRefs.current[pi] = el; }}
                  data-testid={`kerala-card-right-${pi}`}
                  style={{
                    width: cardR.w,
                    height: cardR.h,
                    borderRadius: 12,
                    overflow: "hidden",
                    boxShadow: "0 24px 60px rgba(0,0,0,0.7), 0 4px 20px rgba(0,0,0,0.5)",
                    position: "relative",
                    flexShrink: 0,
                    marginTop: 32,
                  }}
                >
                  <img
                    src={cardR.img}
                    alt={cardR.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 55%)" }} />
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "18px 16px" }}>
                    <div className="font-cinzel text-white font-semibold" style={{ fontSize: 13, letterSpacing: "0.05em", marginBottom: 4 }}>
                      {cardR.title}
                    </div>
                    <div className="font-montserrat text-white/55 uppercase" style={{ fontSize: 8, letterSpacing: "0.2em" }}>
                      {cardR.sub}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Footer CTA ── */}
      <div
        style={{
          height: "50vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#050505",
          gap: 20,
        }}
      >
        <div className="font-montserrat text-white/30 uppercase" style={{ fontSize: 9, letterSpacing: "0.4em" }}>
          Begin Your Journey
        </div>
        <h3 className="font-cinzel text-white font-bold text-center" style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)", letterSpacing: "0.04em" }}>
          Kerala Awaits
        </h3>
        <button
          onClick={handleClose}
          className="font-montserrat uppercase"
          style={{
            marginTop: 12,
            padding: "14px 36px",
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.3)",
            borderRadius: 2,
            color: "rgba(255,255,255,0.8)",
            fontSize: 10,
            letterSpacing: "0.3em",
            cursor: "pointer",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.08)";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.6)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)";
          }}
        >
          Return to Map
        </button>
      </div>
    </div>
  );
}
