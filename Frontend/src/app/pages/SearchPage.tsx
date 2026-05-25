import { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router';
import { useApp } from '../context/AppContext';
import { api, ApiProduct, getAssetUrl, formatCurrency } from '../lib/api';
import { ProductCard, Product } from '../components/ProductCard';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { SlidersHorizontal, RotateCcw, Search as SearchIcon, Filter, Loader2 } from 'lucide-react';
import { Separator } from '../components/ui/separator';
import { Footer } from '../components/Footer';
import { MobileDrawer } from '../components/ui/MobileDrawer';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Slider } from "../components/ui/slider";
import { Button } from "../components/ui/button";

function parseSortParam(raw: string | null): 'asc' | 'dsc' | 'none' {
  if (raw === 'asc' || raw === 'dsc') return raw;
  return 'none';
}

function mapApiProduct(p: ApiProduct): Product {
  return {
    id: p._id,
    name: p.name,
    price: p.price,
    stock: p.stock,
    category: p.category,
    image: getAssetUrl(p.photo),
    inStock: p.stock > 0,
    rating: 4.6,
    reviews: 0,
    isNew: p.createdAt
      ? Date.now() - new Date(p.createdAt).getTime() < 1000 * 60 * 60 * 24 * 14
      : false,
  };
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const { categories, handleAddToCart } = useApp();
  
  // ── Pagination & product state ──────────────────────────────────────────────
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  // Separate initial-load from incremental-load so we don't flash the full spinner on scroll
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [error, setError] = useState('');
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Sentinel div observed by IntersectionObserver to trigger next-page fetch
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  
  // Filters state derived from URL
  const category = (searchParams.get('category') || 'all').toLowerCase();
  const sort = parseSortParam(searchParams.get('sort'));
  const maxPrice = Number(searchParams.get('price')) || 100000;
  const minPrice = Number(searchParams.get('minPrice')) || 0;

  const PRICE_RANGES = [
    { label: "Up to ₹300", min: 0, max: 300 },
    { label: "₹300 - ₹500", min: 300, max: 500 },
    { label: "₹500 - ₹800", min: 500, max: 800 },
    { label: "₹800 - ₹1,300", min: 800, max: 1300 },
    { label: "Over ₹1,300", min: 1300, max: 100000 },
  ];

  // Sync filters to URL
  const updateFilters = (
    newCategory: string, 
    newSort: 'asc' | 'dsc' | 'none', 
    newMax: number, 
    newMin: number = 0
  ) => {
    const params = new URLSearchParams(searchParams);
    
    if (newCategory !== 'all') params.set('category', newCategory);
    else params.delete('category');
    
    if (newSort !== 'none') params.set('sort', newSort);
    else params.delete('sort');

    if (newMax < 100000) params.set('price', String(newMax));
    else params.delete('price');

    if (newMin > 0) params.set('minPrice', String(newMin));
    else params.delete('minPrice');
    
    setSearchParams(params, { replace: true });
  };

  const handleClearFilters = () => {
    updateFilters('all', 'none', 100000, 0);
  };

  // Stable fetch helper – recreated only when filter deps change
  const fetchPage = useCallback(
    async (pageNum: number, signal: AbortSignal) => {
      const data = await api.getProducts({
        search: query,
        category: category === 'all' ? undefined : category,
        sort: sort === 'none' ? undefined : sort,
        page: pageNum,
        price: maxPrice < 100000 ? maxPrice : undefined,
        minPrice: minPrice > 0 ? minPrice : undefined,
      });
      if (signal.aborted) return null;
      return data;
    },
    [query, category, sort, maxPrice, minPrice]
  );

  // Effect 1: Reset & fetch page 1 whenever filters change
  useEffect(() => {
    const controller = new AbortController();
    setProducts([]);
    setPage(1);
    setTotalPage(1);
    setTotalProducts(0);
    setError('');
    setIsInitialLoading(true);

    fetchPage(1, controller.signal)
      .then((data) => {
        if (!data || controller.signal.aborted) return;
        setProducts(data.products.map(mapApiProduct));
        setTotalPage(data.totalPage);
        setTotalProducts(data.totalProducts);
        setPage(2); // next page to load
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Failed to fetch results');
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsInitialLoading(false);
      });

    return () => controller.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, category, sort, maxPrice, minPrice]);

  // Effect 2: IntersectionObserver watches sentinel div to load subsequent pages
  useEffect(() => {
    if (isInitialLoading) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && page <= totalPage && !isFetchingMore) {
          const controller = new AbortController();
          setIsFetchingMore(true);

          fetchPage(page, controller.signal)
            .then((data) => {
              if (!data || controller.signal.aborted) return;
              setProducts((prev) => [...prev, ...data.products.map(mapApiProduct)]);
              setTotalPage(data.totalPage);
              setTotalProducts(data.totalProducts);
              setPage((prev) => prev + 1);
            })
            .catch((err) => {
              if (controller.signal.aborted) return;
              setError(err instanceof Error ? err.message : 'Failed to load more products');
            })
            .finally(() => {
              if (!controller.signal.aborted) setIsFetchingMore(false);
            });
        }
      },
      { rootMargin: '200px' } // pre-fetch 200px before sentinel enters viewport
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [isInitialLoading, page, totalPage, isFetchingMore, fetchPage]);

  const hasMore = page <= totalPage;

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background">
      <main className="flex-1 container mx-auto px-4 py-8 2xl:max-w-7xl">
        <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
               <SearchIcon className="h-5 w-5 text-primary" />
               <h1 className="text-3xl font-bold tracking-tight">
                 Search Results
               </h1>
            </div>
            <p className="text-muted-foreground">
              {query ? (
                <>Showing results for <span className="text-foreground font-semibold">"{query}"</span></>
              ) : (
                "Showing all products"
              )}
              {isInitialLoading
                ? '...'
                : ` — ${totalProducts} item${totalProducts !== 1 ? 's' : ''} found`}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
             <Button 
               variant="outline" 
               size="sm" 
               onClick={() => setIsFilterDrawerOpen(true)}
               className="h-9 px-3 gap-2 text-xs font-medium lg:hidden"
             >
                <Filter className="h-3.5 w-3.5" />
                Filters
             </Button>
             <Button 
               variant="outline" 
               size="sm" 
               onClick={handleClearFilters}
               className="h-9 px-3 gap-2 text-xs font-medium hidden lg:flex"
             >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset Filters
             </Button>
          </div>
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-[280px_1fr] gap-8 items-start">
          {/* Sidebar Filters - Desktop */}
          <aside className="w-full hidden lg:block sticky top-24 space-y-6">
            <Card className="border-0 shadow-xl bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg font-bold">
                  <SlidersHorizontal className="h-5 w-5 text-primary" />
                  Filter Options
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Category Filter */}
                <div className="space-y-3">
                  <Label className="text-sm font-bold text-foreground/80 uppercase tracking-wider">Category</Label>
                  <Select value={category} onValueChange={(val) => updateFilters(val, sort, maxPrice, minPrice)}>
                    <SelectTrigger className="w-full bg-background/50 border-primary/20 hover:border-primary/50 transition-colors">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.name} value={cat.name} className="capitalize">
                          {cat.name} ({cat.itemCount})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator className="bg-primary/10" />

                {/* Price Sort Filter */}
                <div className="space-y-3">
                  <Label className="text-sm font-bold text-foreground/80 uppercase tracking-wider">Sort By Price</Label>
                  <Select value={sort} onValueChange={(val) => updateFilters(category, parseSortParam(val), maxPrice, minPrice)}>
                    <SelectTrigger className="w-full bg-background/50 border-primary/20 hover:border-primary/50 transition-colors">
                      <SelectValue placeholder="Select Sort Order" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Relevance</SelectItem>
                      <SelectItem value="asc">Price: Low to High</SelectItem>
                      <SelectItem value="dsc">Price: High to Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator className="bg-primary/10" />

                {/* Price Ranges Filter */}
                <div className="space-y-3">
                  <Label className="text-sm font-bold text-foreground/80 uppercase tracking-wider">Price Range</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {PRICE_RANGES.map((range) => (
                      <Button
                        key={range.label}
                        variant="ghost"
                        size="sm"
                        onClick={() => updateFilters(category, sort, range.max, range.min)}
                        className={`justify-center h-9 text-[10px] font-bold px-1 rounded-md transition-all border ${
                          minPrice === range.min && maxPrice === range.max
                            ? "bg-primary/20 text-primary border-primary/40 shadow-sm"
                            : "bg-background/50 hover:bg-primary/10 text-muted-foreground hover:text-foreground border-primary/5"
                        }`}
                      >
                        {range.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <Separator className="bg-primary/10" />

                {/* Price Range Slider Filter */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-bold text-foreground/80 uppercase tracking-wider">Custom Max Price</Label>
                    <span className="text-xs font-mono font-bold text-primary">
                      {formatCurrency(maxPrice)}
                    </span>
                  </div>
                  <Slider
                    value={[maxPrice]}
                    max={100000}
                    step={1000}
                    onValueChange={(val) => updateFilters(category, sort, val[0], 0)}
                    className="py-4"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground font-bold">
                    <span>{formatCurrency(0)}</span>
                    <span>{formatCurrency(100000)}+</span>
                  </div>
                </div>

              </CardContent>
            </Card>
          </aside>

          {/* Mobile Filter Drawer */}
          <MobileDrawer 
            isOpen={isFilterDrawerOpen} 
            onClose={() => setIsFilterDrawerOpen(false)}
            title={
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5 text-primary" />
                <span>Filters</span>
              </div>
            }
          >
            <div className="p-4 space-y-6">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  handleClearFilters();
                  setIsFilterDrawerOpen(false);
                }}
                className="w-full mb-2 gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Reset All Filters
              </Button>

              {/* Category Filter */}
              <div className="space-y-3">
                <Label className="text-sm font-bold text-foreground/80 uppercase tracking-wider">Category</Label>
                <Select value={category} onValueChange={(val) => updateFilters(val, sort, maxPrice, minPrice)}>
                  <SelectTrigger className="w-full bg-background/50 border-primary/20 hover:border-primary/50 transition-colors">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.name} value={cat.name} className="capitalize">
                        {cat.name} ({cat.itemCount})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator className="bg-primary/10" />

              {/* Price Sort Filter */}
              <div className="space-y-3">
                <Label className="text-sm font-bold text-foreground/80 uppercase tracking-wider">Sort By Price</Label>
                <Select value={sort} onValueChange={(val) => updateFilters(category, parseSortParam(val), maxPrice, minPrice)}>
                  <SelectTrigger className="w-full bg-background/50 border-primary/20 hover:border-primary/50 transition-colors">
                    <SelectValue placeholder="Select Sort Order" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Relevance</SelectItem>
                    <SelectItem value="asc">Price: Low to High</SelectItem>
                    <SelectItem value="dsc">Price: High to Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator className="bg-primary/10" />

              {/* Price Ranges Filter */}
              <div className="space-y-3">
                <Label className="text-sm font-bold text-foreground/80 uppercase tracking-wider">Price Range</Label>
                <div className="grid grid-cols-2 gap-2">
                  {PRICE_RANGES.map((range) => (
                    <Button
                      key={range.label}
                      variant="ghost"
                      size="sm"
                      onClick={() => updateFilters(category, sort, range.max, range.min)}
                      className={`justify-center h-9 text-[10px] font-bold px-1 rounded-md transition-all border ${
                        minPrice === range.min && maxPrice === range.max
                          ? "bg-primary/20 text-primary border-primary/40 shadow-sm"
                          : "bg-background/50 hover:bg-primary/10 text-muted-foreground hover:text-foreground border-primary/5"
                      }`}
                    >
                      {range.label}
                    </Button>
                  ))}
                </div>
              </div>

              <Separator className="bg-primary/10" />

              {/* Price Range Slider Filter */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-bold text-foreground/80 uppercase tracking-wider">Custom Max Price</Label>
                  <span className="text-xs font-mono font-bold text-primary">
                    {formatCurrency(maxPrice)}
                  </span>
                </div>
                <Slider
                  value={[maxPrice]}
                  max={100000}
                  step={1000}
                  onValueChange={(val) => updateFilters(category, sort, val[0], 0)}
                  className="py-4"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground font-bold">
                  <span>{formatCurrency(0)}</span>
                  <span>{formatCurrency(100000)}+</span>
                </div>
              </div>
            </div>
            <div className="p-4 border-t sticky bottom-0 bg-card z-10">
               <Button onClick={() => setIsFilterDrawerOpen(false)} className="w-full">
                 View Results
               </Button>
            </div>
          </MobileDrawer>

          {/* Results Grid */}
          <div className="w-full min-h-[600px]">
            {isInitialLoading ? (
              <div className="flex flex-col items-center justify-center h-[400px] space-y-4">
                <div className="relative">
                   <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                   <SearchIcon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-primary animate-pulse" />
                </div>
                <p className="text-muted-foreground font-medium animate-pulse">Finding the best gear for you...</p>
              </div>
            ) : error && products.length === 0 ? (
              <Card className="border-destructive/20 bg-destructive/5 overflow-hidden">
                <CardContent className="p-6 flex items-center gap-4 text-destructive">
                  <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                    <SlidersHorizontal className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-lg">Filtering Error</p>
                    <p className="text-sm opacity-80">{error}</p>
                  </div>
                </CardContent>
              </Card>
            ) : products.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={handleAddToCart}
                    />
                  ))}
                </div>

                {/* Invisible sentinel — IntersectionObserver target */}
                <div ref={sentinelRef} className="w-full h-1" aria-hidden="true" />

                {/* Incremental spinner shown while fetching next page */}
                {isFetchingMore && (
                  <div className="flex items-center justify-center gap-3 py-10 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span className="text-sm font-medium">Loading more products…</span>
                  </div>
                )}

                {/* End-of-results indicator */}
                {!hasMore && !isFetchingMore && (
                  <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
                    <div className="h-px w-32 bg-primary/20 mb-2" />
                    <p className="text-sm font-medium">
                      You've seen all{' '}
                      <span className="text-foreground font-bold">{totalProducts}</span> products
                    </p>
                  </div>
                )}

                {/* Inline error when a subsequent page fails */}
                {error && (
                  <div className="flex items-center justify-center gap-2 py-6 text-destructive text-sm">
                    <span>{error}</span>
                    <Button variant="outline" size="sm" onClick={() => { setError(''); setIsFetchingMore(false); }}>
                      Retry
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <Card className="border-0 shadow-2xl overflow-hidden bg-secondary/20">
                <CardContent className="p-16 flex flex-col items-center text-center">
                  <div className="h-24 w-24 rounded-full bg-background flex items-center justify-center mb-6 shadow-inner">
                    <SearchIcon className="h-10 w-10 text-muted-foreground opacity-20" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">No matching products found</h3>
                  <p className="text-muted-foreground max-w-md mb-8">
                    We couldn't find any products matching your search criteria.
                    Try adjusting your filters or search for something else.
                  </p>
                  <Button
                    onClick={handleClearFilters}
                    className="rounded-full px-8 h-12 text-base font-bold shadow-lg shadow-primary/20"
                  >
                    Clear All Filters
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
