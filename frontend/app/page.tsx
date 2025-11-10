import { Suspense } from "react";
import { ProductsView } from "@/components/products-view";

export default function HomePage() {
  return (
    <Suspense fallback={<p>Loading catalog...</p>}>
      <ProductsView />
    </Suspense>
  );
}
