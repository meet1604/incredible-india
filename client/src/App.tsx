// import { useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Cookbook from "@/pages/cookbook";
import Admin from "@/pages/admin";
// import { GlobeLoader } from "@/components/GlobeLoader";

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

// function AppContent() {
//   const [location] = useLocation();
//   const [loaded, setLoaded] = useState(false);
//   const showLoader = !loaded && location === "/";
//
//   return (
//     <>
//       {showLoader && <GlobeLoader onComplete={() => setLoaded(true)} />}
//       <Router />
//     </>
//   );
// }

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
