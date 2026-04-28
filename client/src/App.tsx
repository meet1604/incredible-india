import { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Cookbook from "@/pages/cookbook";
import Admin from "@/pages/admin";
import { GlobeLoader } from "@/components/GlobeLoader";
import Lenis from "lenis";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/cookbook" component={Cookbook} />
      <Route path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const [location] = useLocation();
  const [preloaded, setPreloaded] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const isHome = location === "/";

  return (
    <>
      {/* Globe loader — only on home, only until done */}
      {!loaded && isHome && (
        <GlobeLoader
          onPreload={() => setPreloaded(true)}
          onComplete={() => {
            window.scrollTo(0, 0);
            setLoaded(true);
          }}
        />
      )}

      {/* Non-home pages always render normally */}
      {!isHome && <Router />}

      {/* Home: mount silently when preloaded so video loads, reveal when done */}
      {isHome && (preloaded || loaded) && (
        <motion.div
          animate={{ opacity: loaded ? 1 : 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{ pointerEvents: loaded ? "auto" : "none" }}
        >
          <Router />
        </motion.div>
      )}
    </>
  );
}

function App() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      prevent: (node: Element) => !!node.closest("[data-lenis-prevent]"),
    });

    let raf: number;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
