import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Wishlist, api, getAssetUrl, formatCurrency } from '../lib/api';
import { Trash2, ShoppingCart, Plus, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { toast } from 'react-toastify';
import { Product } from '../components/ProductCard';

export default function WishlistsPage() {
  const { wishlists, setWishlists, isWishlistLoading, isDark, handleAddToCart } = useApp();
  const [selectedList, setSelectedList] = useState<Wishlist | null>(null);
  const [newListName, setNewListName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (wishlists.length > 0 && !selectedList) {
      setSelectedList(wishlists[0]);
    } else if (wishlists.length > 0 && selectedList) {
      const updatedList = wishlists.find(w => w._id === selectedList._id);
      setSelectedList(updatedList || wishlists[0]);
    } else {
      setSelectedList(null);
    }
  }, [wishlists, selectedList]);

  const handleCreateWishlist = async () => {
    if (!newListName.trim()) return;
    setIsCreating(true);
    try {
      const { wishlist } = await api.createWishlist(newListName.trim());
      setWishlists([...wishlists, wishlist]);
      setNewListName('');
      setSelectedList(wishlist);
      toast.success('Wishlist created', { theme: isDark ? 'dark' : 'light' });
    } catch (error: any) {
      toast.error(error.message || 'Failed to create wishlist', { theme: isDark ? 'dark' : 'light' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteWishlist = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this wishlist?')) return;
    setIsDeleting(id);
    try {
      await api.deleteWishlist(id);
      setWishlists(wishlists.filter(w => w._id !== id));
      if (selectedList?._id === id) {
        setSelectedList(null);
      }
      toast.success('Wishlist deleted', { theme: isDark ? 'dark' : 'light' });
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete wishlist', { theme: isDark ? 'dark' : 'light' });
    } finally {
      setIsDeleting(null);
    }
  };

  const handleRemoveItem = async (productId: string) => {
    if (!selectedList) return;
    try {
      const { wishlist } = await api.removeFromWishlist(selectedList._id, productId);
      setWishlists(wishlists.map(w => w._id === wishlist._id ? wishlist : w));
      toast.success('Product removed', { theme: isDark ? 'dark' : 'light' });
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove product', { theme: isDark ? 'dark' : 'light' });
    }
  };

  const mapToProduct = (apiProduct: any): Product => {
    return {
      id: apiProduct._id,
      name: apiProduct.name,
      price: apiProduct.price,
      rating: 4.6,
      reviews: 0,
      image: getAssetUrl(apiProduct.photo),
      category: apiProduct.category || 'Product',
      inStock: apiProduct.stock > 0,
      stock: apiProduct.stock,
    };
  };

  if (isWishlistLoading && wishlists.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Wishlists</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-card rounded-xl border p-4 shadow-sm">
            <h2 className="font-semibold mb-4">Your Lists</h2>
            <div className="space-y-2">
              {wishlists.map(list => (
                <div
                  key={list._id}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedList?._id === list._id
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-secondary'
                  }`}
                  onClick={() => setSelectedList(list)}
                >
                  <span className="font-medium truncate mr-2">{list.name}</span>
                  <button
                    onClick={(e) => handleDeleteWishlist(list._id, e)}
                    disabled={isDeleting === list._id}
                    className="p-1 rounded-full hover:bg-black/10 transition-colors shrink-0"
                    title="Delete wishlist"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {wishlists.length === 0 && (
                <p className="text-sm text-muted-foreground py-2 text-center">No wishlists found.</p>
              )}
            </div>

            <div className="mt-6 pt-6 border-t space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">Create New List</h3>
              <div className="flex flex-col gap-2">
                <Input
                  placeholder="List name"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateWishlist()}
                />
                <Button 
                  onClick={handleCreateWishlist}
                  disabled={!newListName.trim() || isCreating}
                  className="w-full gap-2"
                >
                  {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Create
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="md:col-span-3">
          {!selectedList ? (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 bg-card rounded-xl border border-dashed">
              <HeartIcon className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No Wishlist Selected</h3>
              <p className="text-muted-foreground">
                Select a wishlist from the sidebar or create a new one to start saving products.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">{selectedList.name}</h2>
                <span className="text-muted-foreground">
                  {selectedList.items.length} {selectedList.items.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              {selectedList.items.length === 0 ? (
                <div className="text-center p-12 bg-card rounded-xl border">
                  <p className="text-muted-foreground">This wishlist is empty.</p>
                  <Button variant="link" onClick={() => window.location.href = '/search'}>
                    Browse Products
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {selectedList.items.map((item) => {
                    const product = mapToProduct(item.product);
                    return (
                      <Card key={item.product._id} className="group overflow-hidden flex flex-col">
                        <div className="relative aspect-square overflow-hidden bg-secondary/30">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <button
                            onClick={() => handleRemoveItem(item.product._id)}
                            className="absolute top-2 right-2 p-2 bg-background/80 backdrop-blur rounded-full text-muted-foreground hover:text-destructive hover:bg-background transition-colors opacity-0 group-hover:opacity-100 shadow-sm"
                            title="Remove from wishlist"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <CardContent className="p-4 flex-1 flex flex-col">
                          <h3 className="font-medium line-clamp-2 mb-2 flex-1">{product.name}</h3>
                          <div className="flex items-center justify-between mt-auto">
                            <span className="text-lg font-bold">{formatCurrency(product.price)}</span>
                            <Button
                              size="sm"
                              className="gap-2"
                              disabled={!product.inStock}
                              onClick={() => handleAddToCart(product)}
                            >
                              <ShoppingCart className="h-4 w-4" />
                              Add
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Simple Heart Icon for the empty state
function HeartIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}
