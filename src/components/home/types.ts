import type { ShelfProduct } from "@/components/product/ShelfTile/ShelfTile";

export interface HomeWeaponType {
  key: string;
  name: string;
  count: number;
  minPrice: number | null;
  weapons: { name: string; slug: string; count: number }[];
}

export interface HomeRarity {
  key: string;
  label: string;
  color: string;
  count: number;
}

export interface HomeData {
  totalProducts: number;
  types: HomeWeaponType[];
  featured: ShelfProduct[];
  rarities: HomeRarity[];
  newest: ShelfProduct[];
}
