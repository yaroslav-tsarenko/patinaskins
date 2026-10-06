import type { HomepageProduct } from "@/lib/homepage-products";

export type HomeProduct = HomepageProduct;

export interface HomeCategory {
  name: string;
  slug: string;
  count: number;
}

export interface HomeDrawer extends HomeCategory {
  products: HomeProduct[];
}

export interface HomeHero {
  shelves: { category: HomeCategory; products: HomeProduct[] }[];
  cupboards: { category: HomeCategory; products: HomeProduct[] }[];
  drawers: HomeCategory[];
}

export interface HomeData {
  hero: HomeHero;
  drawers: HomeDrawer[];
  topShelf: { ranked: boolean; products: HomeProduct[] };
  rack: { category: HomeCategory | null; products: HomeProduct[] };
  hooks: { categories: HomeCategory[]; products: HomeProduct[] };
  reduced: HomeProduct[];
  newest: HomeProduct[];
  totalProducts: number;
}
