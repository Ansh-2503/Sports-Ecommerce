import { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router';
import { Hero } from '../components/Hero';
import { PromoBanner } from '../components/PromoBanner';
import { CategoryCard } from '../components/CategoryCard';
import { ProductCard } from '../components/ProductCard';
import { Newsletter } from '../components/Newsletter';
import { Footer } from '../components/Footer';
import { Button } from '../components/ui/button';
import { ErrorState, ProductGridSkeleton, EmptyState } from '../components/feedback/PageState';

export default function HomePage() {
  const navigate = useNavigate();
  const {
    displayedCategories,
    selectedCategory,
    setSelectedCategory,
    products,
    isLoadingProducts,
    productError,
    handleAddToCart,
    retryProducts,
  } = useApp();

  
  useEffect(() => {
    setSelectedCategory('all');
  }, [setSelectedCategory]);

  return (
    <>
      <main className="flex-1">
        <Hero />

        <PromoBanner />

        <section className="container mx-auto px-4 py-8 md:py-16">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="mb-2">Shop by Category</h2>
              <p className="text-muted-foreground">Find the perfect equipment for your sport</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {displayedCategories.map((category) => (
              <button
                key={category.name}
                onClick={() => navigate(`/search?category=${encodeURIComponent(category.name)}`)}
                className="text-left"
              >
                <CategoryCard
                  name={category.name}
                  icon={category.icon}
                  itemCount={category.itemCount}
                />
              </button>
            ))}
          </div>
        </section>

        <section id="featured-products" className="container mx-auto px-4 py-8 md:py-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="mb-2">Featured Products</h2>
              <p className="text-muted-foreground">
                {selectedCategory === 'all' ? 'Live inventory from your store' : selectedCategory}
              </p>
            </div>
            <Button variant="link" onClick={() => navigate('/search')} className="text-primary cursor-pointer">
              View all products &rarr;
            </Button>
          </div>

          {productError && (
            <div className="mb-6">
              <ErrorState message={productError} onRetry={retryProducts} />
            </div>
          )}

          {isLoadingProducts ? (
            <ProductGridSkeleton count={8} />
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No products in this category"
              description="Try another category or browse the full catalogue."
              action={
                <Button variant="default" className="mt-2" onClick={() => navigate('/search')}>
                  Browse all products
                </Button>
              }
            />
          )}
        </section>

        <Newsletter />
      </main>

      <Footer />
    </>
  );
}
