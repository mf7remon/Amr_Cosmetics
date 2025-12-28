import ProductCard from "../components/ProductCard";

export default function ProductsPage() {
  return (
    <div className="px-8 py-10">
      <h2 className="text-3xl font-bold text-pink-500 mb-6">
        Our Products
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        <ProductCard />
        <ProductCard />
        <ProductCard />
      </div>
    </div>
  );
}
