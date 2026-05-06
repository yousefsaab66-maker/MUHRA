import { Suspense } from "react";
import { ProductsCatalog } from "./ProductsCatalog";

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="page-gutter py-20 md:py-28" />}>
      <ProductsCatalog />
    </Suspense>
  );
}
