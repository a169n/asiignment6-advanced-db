import { ProductDetail } from "@/components/product-detail";

interface ProductDetailPageProps {
  params: { id: string };
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  return (
    <div className="space-y-6">
      <ProductDetail productId={params.id} />
    </div>
  );
}
