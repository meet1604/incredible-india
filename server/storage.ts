import {
  type User, type InsertUser,
  type SiteSettings, type InsertSiteSettings,
  type Hotspot, type InsertHotspot,
  type Recipe, type InsertRecipe,
  users, siteSettings, hotspots, recipes
} from "@shared/schema";
import { randomUUID } from "crypto";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import pg from "pg";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Site Settings
  getSiteSettings(): Promise<SiteSettings>;
  updateSiteSettings(settings: InsertSiteSettings): Promise<SiteSettings>;

  // Hotspots
  getHotspots(): Promise<Hotspot[]>;
  createHotspot(hotspot: InsertHotspot): Promise<Hotspot>;
  updateHotspot(id: string, hotspot: InsertHotspot): Promise<Hotspot>;
  deleteHotspot(id: string): Promise<void>;

  // Recipes
  getRecipes(): Promise<Recipe[]>;
  createRecipe(recipe: InsertRecipe): Promise<Recipe>;
  updateRecipe(id: string, recipe: InsertRecipe): Promise<Recipe>;
  deleteRecipe(id: string): Promise<void>;
}

// ── Database Storage ──────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: Omit<SiteSettings, "id"> = {
  heroMediaType: "video",
  heroVideoUrl: "/Experince Indian 2.mp4",
  heroImageUrl: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1920&q=80",
  heroTitle: "INCREDIBLE",
  heroSubtitle: "INDIA",
  heroDescription: "A Thousand Worlds in One",
  showHeroTitle: true,
  showHeroSubtitle: true,
  showHeroDescription: true,
};

const DEFAULT_HOTSPOTS: InsertHotspot[] = [
  { timeStart: 0, timeEnd: 9, x: "54%", y: "42%", label: "UNESCO World Heritage", title: "Taj Mahal", location: "Agra, Uttar Pradesh", description: "Built over 22 years by 22,000 artisans, Shah Jahan's eternal symbol of love rises 73 metres in pure white marble above the sacred Yamuna river." },
  { timeStart: 10, timeEnd: 19, x: "48%", y: "32%", label: "The Roof of the World", title: "The Himalayas", location: "North India", description: "The world's highest mountain range stretches across northern India — a vast wilderness of glaciers, ancient valleys, and snow-draped peaks touching the sky." },
  { timeStart: 20, timeEnd: 29, x: "42%", y: "52%", label: "Adventure Capital", title: "Manali", location: "Himachal Pradesh", description: "Nestled at 2,050 metres, Manali is a gateway to the high Himalayas — famed for snow-cloaked forests, mountain roads, and thrilling alpine adventure." },
  { timeStart: 30, timeEnd: 39, x: "28%", y: "48%", label: "Oldest Living City", title: "Varanasi Ghats", location: "Varanasi, Uttar Pradesh", description: "One of the world's oldest continuously inhabited cities, Varanasi's ancient ghats line the sacred Ganges — alive with prayer, ritual, and the rhythm of daily life." },
  { timeStart: 40, timeEnd: 49, x: "50%", y: "44%", label: "Engineering Marvel", title: "Bandra-Worli Sea Link", location: "Mumbai, Maharashtra", description: "Spanning 5.6 kilometres across Mahim Bay, this cable-stayed marvel connects Mumbai's suburbs to its beating heart, with the city skyline rising beyond." },
  { timeStart: 50, timeEnd: 59, x: "50%", y: "58%", label: "Biodiversity Hotspot", title: "Western Ghats", location: "Sahyadri, Maharashtra", description: "A UNESCO World Heritage Site, the Western Ghats erupt in lush green gorges during monsoon — home to some of the world's most diverse ecosystems." },
  { timeStart: 60, timeEnd: 69, x: "38%", y: "55%", label: "Pearl of the Orient", title: "Goa Coastline", location: "Goa", description: "Miles of golden sand backed by swaying palms and the warm Arabian Sea — Goa's coastline offers a perfect blend of sun, serenity, and Portuguese heritage." },
  { timeStart: 70, timeEnd: 79, x: "30%", y: "50%", label: "City of Lakes", title: "Lake Pichola", location: "Udaipur, Rajasthan", description: "The shimmering Lake Pichola cradles the legendary Lake Palace at its heart — a vision of white marble that seems to float on the water like a dream." },
  { timeStart: 80, timeEnd: 89, x: "38%", y: "52%", label: "Venice of the East", title: "City Palace", location: "Udaipur, Rajasthan", description: "Bathed in golden light at dusk, Udaipur's City Palace rises majestically from the lakeside — a 400-year-old royal complex of courtyards, towers, and carved marble." },
  { timeStart: 90, timeEnd: 99, x: "60%", y: "38%", label: "Impregnable Fortress", title: "Mehrangarh Fort", location: "Jodhpur, Rajasthan", description: "Towering 125 metres above the Blue City, Mehrangarh is one of India's largest forts — its sheer sandstone walls a testament to Rajput might and grandeur." },
  { timeStart: 100, timeEnd: 109, x: "50%", y: "62%", label: "Wildlife Sanctuary", title: "Jim Corbett National Park", location: "Uttarakhand", description: "India's oldest national park is a haven for wildlife — its ancient sal forests shelter elephants, leopards, and the majestic Bengal tiger in their natural home." },
  { timeStart: 110, timeEnd: 119, x: "55%", y: "50%", label: "God's Own Country", title: "Munnar Tea Gardens", location: "Munnar, Kerala", description: "Rolling hills carpeted in emerald tea plantations stretch to the horizon at Munnar — a serene highland retreat bathed in golden mist and cool mountain air." },
];

const DEFAULT_RECIPES: InsertRecipe[] = [
  {
    title: "Butter Chicken",
    region: "North India",
    description: "A rich, creamy tomato-based curry with tender pieces of grilled chicken.",
    image: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800&q=80",
    prepTime: "20 mins",
    cookTime: "40 mins",
    servings: 4,
    difficulty: "Medium",
    ingredients: ["Chicken", "Tomato puree", "Cream", "Butter"],
    instructions: ["Marinate chicken", "Grill chicken", "Make gravy", "Combine"],
  },
];

export class DatabaseStorage implements IStorage {
  private db;

  constructor(databaseUrl: string) {
    const pool = new pg.Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false },
    });
    this.db = drizzle(pool);
  }

  async seed() {
    // Seed site settings if empty
    const existing = await this.db.select().from(siteSettings).limit(1);
    if (existing.length === 0) {
      await this.db.insert(siteSettings).values({ id: 1, ...DEFAULT_SETTINGS });
    }

    // Seed hotspots if empty
    const existingHotspots = await this.db.select().from(hotspots).limit(1);
    if (existingHotspots.length === 0) {
      for (const h of DEFAULT_HOTSPOTS) {
        await this.db.insert(hotspots).values({ ...h, id: randomUUID() });
      }
    }

    // Seed recipes if empty
    const existingRecipes = await this.db.select().from(recipes).limit(1);
    if (existingRecipes.length === 0) {
      for (const r of DEFAULT_RECIPES) {
        await this.db.insert(recipes).values({ ...r, id: randomUUID() });
      }
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await this.db.insert(users).values({ ...insertUser, id: randomUUID() }).returning();
    return result[0];
  }

  async getSiteSettings(): Promise<SiteSettings> {
    const result = await this.db.select().from(siteSettings).limit(1);
    return result[0];
  }

  async updateSiteSettings(settings: InsertSiteSettings): Promise<SiteSettings> {
    const result = await this.db
      .insert(siteSettings)
      .values({ id: 1, ...settings })
      .onConflictDoUpdate({ target: siteSettings.id, set: settings })
      .returning();
    return result[0];
  }

  async getHotspots(): Promise<Hotspot[]> {
    return this.db.select().from(hotspots);
  }

  async createHotspot(hotspot: InsertHotspot): Promise<Hotspot> {
    const result = await this.db.insert(hotspots).values({ ...hotspot, id: randomUUID() }).returning();
    return result[0];
  }

  async updateHotspot(id: string, hotspot: InsertHotspot): Promise<Hotspot> {
    const result = await this.db.update(hotspots).set(hotspot).where(eq(hotspots.id, id)).returning();
    return result[0];
  }

  async deleteHotspot(id: string): Promise<void> {
    await this.db.delete(hotspots).where(eq(hotspots.id, id));
  }

  async getRecipes(): Promise<Recipe[]> {
    return this.db.select().from(recipes);
  }

  async createRecipe(recipe: InsertRecipe): Promise<Recipe> {
    const result = await this.db.insert(recipes).values({ ...recipe, id: randomUUID() }).returning();
    return result[0];
  }

  async updateRecipe(id: string, recipe: InsertRecipe): Promise<Recipe> {
    const result = await this.db.update(recipes).set(recipe).where(eq(recipes.id, id)).returning();
    return result[0];
  }

  async deleteRecipe(id: string): Promise<void> {
    await this.db.delete(recipes).where(eq(recipes.id, id));
  }
}

// ── In-Memory Storage (fallback) ──────────────────────────────────────────────

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private siteSettings: SiteSettings;
  private hotspots: Map<string, Hotspot>;
  private recipes: Map<string, Recipe>;

  constructor() {
    this.users = new Map();
    this.hotspots = new Map();
    this.recipes = new Map();

    this.siteSettings = { id: 1, ...DEFAULT_SETTINGS };

    DEFAULT_HOTSPOTS.forEach(h => {
      const id = randomUUID();
      this.hotspots.set(id, { ...h, id } as Hotspot);
    });

    DEFAULT_RECIPES.forEach(r => {
      const id = randomUUID();
      this.recipes.set(id, { ...r, id } as Recipe);
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getSiteSettings(): Promise<SiteSettings> {
    return this.siteSettings;
  }

  async updateSiteSettings(settings: InsertSiteSettings): Promise<SiteSettings> {
    this.siteSettings = { ...settings, id: 1 } as SiteSettings;
    return this.siteSettings;
  }

  async getHotspots(): Promise<Hotspot[]> {
    return Array.from(this.hotspots.values());
  }

  async createHotspot(hotspot: InsertHotspot): Promise<Hotspot> {
    const id = randomUUID();
    const newHotspot = { ...hotspot, id } as Hotspot;
    this.hotspots.set(id, newHotspot);
    return newHotspot;
  }

  async updateHotspot(id: string, hotspot: InsertHotspot): Promise<Hotspot> {
    const updated = { ...hotspot, id } as Hotspot;
    this.hotspots.set(id, updated);
    return updated;
  }

  async deleteHotspot(id: string): Promise<void> {
    this.hotspots.delete(id);
  }

  async getRecipes(): Promise<Recipe[]> {
    return Array.from(this.recipes.values());
  }

  async createRecipe(recipe: InsertRecipe): Promise<Recipe> {
    const id = randomUUID();
    const newRecipe = { ...recipe, id } as Recipe;
    this.recipes.set(id, newRecipe);
    return newRecipe;
  }

  async updateRecipe(id: string, recipe: InsertRecipe): Promise<Recipe> {
    const updated = { ...recipe, id } as Recipe;
    this.recipes.set(id, updated);
    return updated;
  }

  async deleteRecipe(id: string): Promise<void> {
    this.recipes.delete(id);
  }
}

// ── Export ────────────────────────────────────────────────────────────────────

export const storage: IStorage = process.env.DATABASE_URL
  ? new DatabaseStorage(process.env.DATABASE_URL)
  : new MemStorage();
