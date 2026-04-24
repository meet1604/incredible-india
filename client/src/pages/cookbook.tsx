import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronLeft, Clock, Users, Flame, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { type Recipe } from "@shared/schema";
import { RecipeCard } from "@/components/RecipeCard";

export default function Cookbook() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  const { data: recipes, isLoading } = useQuery<Recipe[]>({
    queryKey: ["/api/recipes"],
  });

  const filteredRecipes = recipes?.filter(recipe => 
    recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recipe.region.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-inter">
      {/* Header */}
      <header className="relative h-[40vh] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-[2000ms]"
          style={{ 
            backgroundImage: "url('https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1920&q=80')",
            filter: "brightness(0.4)"
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0a0a0a] z-1" />
        
        <div className="relative z-10 text-center px-6">
          <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-white/60 hover:text-white transition-colors">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="font-montserrat text-xs tracking-widest uppercase">Back to Journey</span>
            </motion.div>
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="font-montserrat text-amber-400 text-[10px] tracking-[0.4em] uppercase font-medium mb-4 block">Culinary Heritage</span>
            <h1 className="font-cinzel text-4xl md:text-6xl font-bold mb-6">Flavors of India</h1>
            <p className="max-w-2xl mx-auto text-white/60 text-sm md:text-base leading-relaxed">
              Discover the diverse and vibrant world of Indian cuisine. From the fiery curries of the South to the rich, aromatic gravies of the North.
            </p>
          </motion.div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 py-12">
        {/* Search and Filters */}
        <div className="mb-12 flex flex-col md:flex-row gap-6 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input 
              placeholder="Search recipes or regions..." 
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:ring-amber-400/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-3 overflow-x-auto pb-2 w-full md:w-auto no-scrollbar">
            {["All Regions", "North", "South", "East", "West"].map((region) => (
              <Badge 
                key={region}
                variant="outline" 
                className="whitespace-nowrap px-4 py-1.5 border-white/10 text-white/60 hover:border-amber-400 hover:text-amber-400 cursor-pointer transition-colors"
              >
                {region}
              </Badge>
            ))}
          </div>
        </div>

        {/* Recipe Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="aspect-[4/5] bg-white/5 animate-pulse rounded-sm" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredRecipes?.map((recipe, index) => (
              <RecipeCard 
                key={recipe.id} 
                recipe={recipe} 
                index={index}
                onClick={() => setSelectedRecipe(recipe)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Recipe Detail Modal */}
      <Dialog open={!!selectedRecipe} onOpenChange={() => setSelectedRecipe(null)}>
        <DialogContent className="max-w-4xl p-0 bg-[#0a0a0a] border-white/10 overflow-hidden">
          {selectedRecipe && (
            <div className="flex flex-col md:flex-row h-full max-h-[90vh] overflow-y-auto">
              <div className="w-full md:w-1/2 h-64 md:h-auto relative">
                <img 
                  src={selectedRecipe.image} 
                  alt={selectedRecipe.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent md:hidden" />
              </div>
              
              <div className="w-full md:w-1/2 p-8 md:p-12 overflow-y-auto">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-3 h-3 text-amber-400" />
                  <span className="text-[10px] font-montserrat tracking-[0.3em] text-amber-400 uppercase font-medium">{selectedRecipe.region}</span>
                </div>
                
                <h2 className="font-cinzel text-3xl font-bold mb-6">{selectedRecipe.title}</h2>
                
                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="text-center p-3 bg-white/5 rounded-sm">
                    <Clock className="w-4 h-4 mx-auto mb-2 text-white/40" />
                    <div className="text-[10px] text-white/40 uppercase mb-1">Cook Time</div>
                    <div className="text-xs font-bold">{selectedRecipe.cookTime}</div>
                  </div>
                  <div className="text-center p-3 bg-white/5 rounded-sm">
                    <Users className="w-4 h-4 mx-auto mb-2 text-white/40" />
                    <div className="text-[10px] text-white/40 uppercase mb-1">Servings</div>
                    <div className="text-xs font-bold">{selectedRecipe.servings}</div>
                  </div>
                  <div className="text-center p-3 bg-white/5 rounded-sm">
                    <Flame className="w-4 h-4 mx-auto mb-2 text-white/40" />
                    <div className="text-[10px] text-white/40 uppercase mb-1">Difficulty</div>
                    <div className="text-xs font-bold">{selectedRecipe.difficulty}</div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div>
                    <h4 className="font-cinzel text-lg font-bold mb-4 flex items-center gap-2">
                      <span className="w-6 h-px bg-amber-400" /> Ingredients
                    </h4>
                    <ul className="space-y-2">
                      {selectedRecipe.ingredients.map((ing, i) => (
                        <li key={i} className="text-sm text-white/60 flex items-center gap-3">
                          <div className="w-1 h-1 bg-amber-400 rounded-full" />
                          {ing}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-cinzel text-lg font-bold mb-4 flex items-center gap-2">
                      <span className="w-6 h-px bg-amber-400" /> Instructions
                    </h4>
                    <div className="space-y-4">
                      {selectedRecipe.instructions.map((step, i) => (
                        <div key={i} className="flex gap-4">
                          <span className="font-cinzel text-amber-400 font-bold opacity-50">{String(i + 1).padStart(2, '0')}</span>
                          <p className="text-sm text-white/60 leading-relaxed">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 mt-12">
        <div className="max-w-screen-xl mx-auto px-6 text-center">
          <div className="font-cinzel text-xl font-bold mb-2">INCREDIBLE INDIA</div>
          <p className="text-white/20 text-xs tracking-widest uppercase">A Thousand Worlds in One</p>
        </div>
      </footer>
    </div>
  );
}
