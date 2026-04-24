import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type SiteSettings, type Hotspot, type Recipe } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Save } from "lucide-react";

import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface AdminPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminPanel({ open, onOpenChange }: AdminPanelProps) {
  const { toast } = useToast();
  const { data: settings } = useQuery<SiteSettings>({ queryKey: ["/api/site-settings"] });
  const { data: hotspots } = useQuery<Hotspot[]>({ queryKey: ["/api/hotspots"] });
  const { data: recipes } = useQuery<Recipe[]>({ queryKey: ["/api/recipes"] });

  const updateSettings = useMutation({
    mutationFn: async (newSettings: Partial<SiteSettings>) => {
      const res = await apiRequest("PATCH", "/api/site-settings", newSettings);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-settings"] });
      toast({ title: "Settings updated" });
    }
  });

  const createHotspot = useMutation({
    mutationFn: async (hotspot: any) => {
      const res = await apiRequest("POST", "/api/hotspots", hotspot);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hotspots"] });
      toast({ title: "Hotspot created" });
    }
  });

  const updateHotspot = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: any }) => {
      const res = await apiRequest("PATCH", `/api/hotspots/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hotspots"] });
      toast({ title: "Hotspot updated" });
    }
  });

  const deleteHotspot = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/hotspots/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hotspots"] });
      toast({ title: "Hotspot deleted" });
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#1a1a1a] text-white border-white/10">
        <DialogHeader>
          <DialogTitle className="font-cinzel text-2xl">Site Editor</DialogTitle>
          <DialogDescription className="text-white/40">
            Manage your website content dynamically.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="hero" className="mt-6">
          <TabsList className="bg-white/5 border-white/10">
            <TabsTrigger value="hero">Hero Banner</TabsTrigger>
            <TabsTrigger value="hotspots">Hotspots</TabsTrigger>
            <TabsTrigger value="recipes">Recipes</TabsTrigger>
          </TabsList>

          <TabsContent value="hero" className="space-y-8 mt-6">
            <div className="space-y-6">
              {/* Media Type Section */}
              <div className="p-4 bg-white/5 border border-white/10 rounded-sm space-y-4">
                <Label className="text-amber-400 uppercase tracking-widest text-[10px]">Media Configuration</Label>
                <RadioGroup 
                  defaultValue={settings?.heroMediaType} 
                  onValueChange={(val) => updateSettings.mutate({ heroMediaType: val })}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="video" id="video" />
                    <Label htmlFor="video">Video</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="image" id="image" />
                    <Label htmlFor="image">Image</Label>
                  </div>
                </RadioGroup>

                {settings?.heroMediaType === "video" ? (
                  <div className="grid gap-2">
                    <Label>Hero Video URL</Label>
                    <Input 
                      defaultValue={settings?.heroVideoUrl} 
                      onBlur={(e) => updateSettings.mutate({ heroVideoUrl: e.target.value })}
                      className="bg-white/5 border-white/10"
                      placeholder="https://vimeo.com/123456789 or https://example.com/video.mp4"
                    />
                    <p className="text-[10px] text-white/30 italic">
                      Tip: Use either a direct video file URL or a Vimeo link. Vimeo works for the hero background, but timed hotspot scrubbing only works with direct video files.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-2">
                    <Label>Hero Image URL</Label>
                    <Input 
                      defaultValue={settings?.heroImageUrl} 
                      onBlur={(e) => updateSettings.mutate({ heroImageUrl: e.target.value })}
                      className="bg-white/5 border-white/10"
                      placeholder="https://images.unsplash.com/..."
                    />
                  </div>
                )}
              </div>

              {/* Text Configuration Section */}
              <div className="p-4 bg-white/5 border border-white/10 rounded-sm space-y-6">
                <Label className="text-amber-400 uppercase tracking-widest text-[10px]">Text Configuration</Label>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Show Title</Label>
                      <p className="text-[10px] text-white/30">Display the main heading</p>
                    </div>
                    <Switch 
                      checked={settings?.showHeroTitle} 
                      onCheckedChange={(val) => updateSettings.mutate({ showHeroTitle: val })} 
                    />
                  </div>
                  {settings?.showHeroTitle && (
                    <Input 
                      defaultValue={settings?.heroTitle} 
                      onBlur={(e) => updateSettings.mutate({ heroTitle: e.target.value })}
                      className="bg-white/5 border-white/10"
                    />
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Show Subtitle</Label>
                      <p className="text-[10px] text-white/30">Display the secondary heading</p>
                    </div>
                    <Switch 
                      checked={settings?.showHeroSubtitle} 
                      onCheckedChange={(val) => updateSettings.mutate({ showHeroSubtitle: val })} 
                    />
                  </div>
                  {settings?.showHeroSubtitle && (
                    <Input 
                      defaultValue={settings?.heroSubtitle} 
                      onBlur={(e) => updateSettings.mutate({ heroSubtitle: e.target.value })}
                      className="bg-white/5 border-white/10"
                    />
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Show Description</Label>
                      <p className="text-[10px] text-white/30">Display the top micro-label</p>
                    </div>
                    <Switch 
                      checked={settings?.showHeroDescription} 
                      onCheckedChange={(val) => updateSettings.mutate({ showHeroDescription: val })} 
                    />
                  </div>
                  {settings?.showHeroDescription && (
                    <Textarea 
                      defaultValue={settings?.heroDescription} 
                      onBlur={(e) => updateSettings.mutate({ heroDescription: e.target.value })}
                      className="bg-white/5 border-white/10"
                    />
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="hotspots" className="space-y-6 mt-6">
            <Button 
              onClick={() => createHotspot.mutate({
                timeStart: 0, timeEnd: 5, x: "50%", y: "50%", 
                label: "New Label", title: "New Spot", location: "Location", description: "Description"
              })}
              className="bg-amber-400 text-black hover:bg-amber-500"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Hotspot
            </Button>

            <div className="space-y-4">
              {hotspots?.map((h) => (
                <div key={h.id} className="p-4 bg-white/5 border border-white/10 rounded-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <Input 
                      className="bg-transparent border-none font-bold text-lg p-0 h-auto focus-visible:ring-0"
                      defaultValue={h.title}
                      onBlur={(e) => updateHotspot.mutate({ id: h.id, data: { title: e.target.value } })}
                    />
                    <Button variant="destructive" size="icon" onClick={() => deleteHotspot.mutate(h.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Start Time (s)</Label>
                      <Input 
                        type="number" 
                        defaultValue={h.timeStart} 
                        className="bg-white/5 border-white/10"
                        onBlur={(e) => updateHotspot.mutate({ id: h.id, data: { timeStart: parseFloat(e.target.value) } })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>End Time (s)</Label>
                      <Input 
                        type="number" 
                        defaultValue={h.timeEnd} 
                        className="bg-white/5 border-white/10"
                        onBlur={(e) => updateHotspot.mutate({ id: h.id, data: { timeEnd: parseFloat(e.target.value) } })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>X Position (%)</Label>
                      <Input 
                        defaultValue={h.x} 
                        className="bg-white/5 border-white/10"
                        onBlur={(e) => updateHotspot.mutate({ id: h.id, data: { x: e.target.value } })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Y Position (%)</Label>
                      <Input 
                        defaultValue={h.y} 
                        className="bg-white/5 border-white/10"
                        onBlur={(e) => updateHotspot.mutate({ id: h.id, data: { y: e.target.value } })}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="recipes" className="mt-6">
            <p className="text-white/40">Recipe management coming soon...</p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
