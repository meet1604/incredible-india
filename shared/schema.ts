import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const siteSettings = pgTable("site_settings", {
  id: integer("id").primaryKey().default(1),
  heroMediaType: text("hero_media_type").notNull().default("video"),
  heroVideoUrl: text("hero_video_url").notNull(),
  heroImageUrl: text("hero_image_url").notNull().default(""),
  heroTitle: text("hero_title").notNull(),
  heroSubtitle: text("hero_subtitle").notNull(),
  heroDescription: text("hero_description").notNull(),
  showHeroTitle: boolean("show_hero_title").notNull().default(true),
  showHeroSubtitle: boolean("show_hero_subtitle").notNull().default(true),
  showHeroDescription: boolean("show_hero_description").notNull().default(true),
});

export const hotspots = pgTable("hotspots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  timeStart: real("time_start").notNull(),
  timeEnd: real("time_end").notNull(),
  x: text("x").notNull(),
  y: text("y").notNull(),
  label: text("label").notNull(),
  title: text("title").notNull(),
  location: text("location").notNull(),
  description: text("description").notNull(),
});

export const recipes = pgTable("recipes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  region: text("region").notNull(),
  description: text("description").notNull(),
  image: text("image").notNull(),
  prepTime: text("prep_time").notNull(),
  cookTime: text("cook_time").notNull(),
  servings: integer("servings").notNull(),
  difficulty: text("difficulty").notNull(),
  ingredients: jsonb("ingredients").$type<string[]>().notNull(),
  instructions: jsonb("instructions").$type<string[]>().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertSiteSettingsSchema = createInsertSchema(siteSettings);
export const insertHotspotSchema = createInsertSchema(hotspots);
export const insertRecipeSchema = createInsertSchema(recipes);

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type SiteSettings = typeof siteSettings.$inferSelect;
export type InsertSiteSettings = z.infer<typeof insertSiteSettingsSchema>;

export type Hotspot = typeof hotspots.$inferSelect;
export type InsertHotspot = z.infer<typeof insertHotspotSchema>;

export type Recipe = typeof recipes.$inferSelect;
export type InsertRecipe = z.infer<typeof insertRecipeSchema>;
