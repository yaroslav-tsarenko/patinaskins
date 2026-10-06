import { ShelfGridSkeleton } from "@/components/product/ShelfTile/ShelfTile";

export function ProductSkeleton({ count = 12, dense = false }: { count?: number; dense?: boolean }) {
  return <ShelfGridSkeleton count={count} dense={dense} />;
}
