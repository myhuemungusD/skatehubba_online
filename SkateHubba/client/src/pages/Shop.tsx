import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { shopApi, Product } from '@/lib/api';
import { useToast } from '@/components/ui/toaster';

export default function ShopPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const { addToast } = useToast();

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', selectedCategory],
    queryFn: () => shopApi.getProducts(selectedCategory ? { category: selectedCategory } : undefined),
  });

  const products = productsData?.data || [];
  const categories = ['decks', 'wheels', 'trucks', 'bearings', 'apparel', 'accessories'];

  const addToCart = (product: Product) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItem = cart.find((item: { productId: number }) => item.productId === product.id);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({ productId: product.id, quantity: 1, product });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    addToast(`Added ${product.name} to cart!`, 'success');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Shop</h1>
        <span className="text-zinc-400">{products.length} products</span>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSelectedCategory('')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            !selectedCategory
              ? 'bg-amber-500 text-zinc-900'
              : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-lg capitalize transition-colors ${
              selectedCategory === cat
                ? 'bg-amber-500 text-zinc-900'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} onAddToCart={() => addToCart(product)} />
        ))}
      </div>

      {products.length === 0 && (
        <div className="text-center py-12 text-zinc-500">
          No products found in this category.
        </div>
      )}
    </div>
  );
}

function ProductCard({ product, onAddToCart }: { product: Product; onAddToCart: () => void }) {
  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 overflow-hidden group hover:border-zinc-700 transition-colors">
      {/* Image */}
      <div className="aspect-square bg-zinc-800 relative">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">
            🛹
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">
          {product.category}
        </p>
        <h3 className="font-semibold mb-2 line-clamp-1">{product.name}</h3>
        
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg font-bold text-amber-500">{formatPrice(product.price)}</span>
        </div>

        <button
          onClick={onAddToCart}
          disabled={!product.inStock}
          className={`w-full py-2 rounded-lg font-medium transition-colors ${
            product.inStock
              ? 'bg-amber-500 hover:bg-amber-400 text-zinc-900'
              : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
          }`}
        >
          {product.inStock ? 'Add to Cart' : 'Out of Stock'}
        </button>
      </div>
    </div>
  );
}
