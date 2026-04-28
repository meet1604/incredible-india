import { useState } from "react";
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
  const [loaded, setLoaded] = useState(false);
  const showLoader = !loaded && location === "/";

  return (
    <>
      {showLoader && (
        <GlobeLoader
          onComplete={() => {
            window.scrollTo(0, 0);
            setLoaded(true);
          }}
        />
      )}
      <AnimatePresence>
        {loaded && (
          <motion.div
            key="main"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <Router />
          </motion.div>
        )}
        {!loaded && location !== "/" && <Router />}
      </AnimatePresence>
    </>
  );
}

function App() {
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
