import { motion } from "framer-motion";
import { MapPin, Clock, Flame } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { type Recipe } from "@shared/schema";

interface RecipeCardProps {
  recipe: Recipe;
  onClick: () => void;
  index: number;
}

export function RecipeCard({ recipe, onClick, index }: RecipeCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      onClick={onClick}
      className="cursor-pointer group"
    >
      <Card className="bg-white/5 border-white/10 overflow-hidden hover:border-amber-400/50 transition-all duration-500">
        <div className="aspect-[4/3] overflow-hidden">
          <img 
            src={recipe.image} 
            alt={recipe.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        </div>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-3 h-3 text-amber-400" />
            <span className="text-[10px] font-montserrat tracking-widest text-amber-400 uppercase">{recipe.region}</span>
          </div>
          <h3 className="font-cinzel text-xl font-bold mb-3 group-hover:text-amber-400 transition-colors">{recipe.title}</h3>
          <p className="text-white/40 text-sm line-clamp-2 mb-4 leading-relaxed">{recipe.description}</p>
          <div className="flex items-center gap-4 text-[10px] font-montserrat tracking-wider text-white/60 uppercase">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {recipe.cookTime}
            </div>
            <div className="flex items-center gap-1">
              <Flame className="w-3 h-3" />
              {recipe.difficulty}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
