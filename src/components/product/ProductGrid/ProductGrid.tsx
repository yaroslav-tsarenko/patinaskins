"use client";

import { ShelfGrid, ShelfTile, type ShelfProduct } from "@/components/product/ShelfTile/ShelfTile";

interface ProductGridProps {
  products: ShelfProduct[];
  dense?: boolean;
  priorityCount?: number;
  className?: string;
}

export function ProductGrid({ products, dense = false, priorityCount = 0, className }: ProductGridProps) {
  return (
    <ShelfGrid dense={dense} className={className}>
      {products.map((product, index) => (
        <ShelfTile key={product.id} product={product} priority={index < priorityCount} />
      ))}
    </ShelfGrid>
  );
}
