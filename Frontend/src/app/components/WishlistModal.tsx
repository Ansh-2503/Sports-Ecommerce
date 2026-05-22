import { useState } from 'react';
import { X, Plus, Check } from 'lucide-react';
import { toast } from 'react-toastify';
import { useApp } from '../context/AppContext';
import { api, Wishlist } from '../lib/api';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface WishlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
}

export function WishlistModal({ isOpen, onClose, productId }: WishlistModalProps) {
  const { wishlists, setWishlists, isDark } = useApp();
  const [newListName, setNewListName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [addingTo, setAddingTo] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreateAndAdd = async () => {
    if (!newListName.trim()) return;
    setIsCreating(true);
    try {
      const { wishlist } = await api.createWishlist(newListName.trim());
      setWishlists([...wishlists, wishlist]);
      await handleAddToWishlist(wishlist._id);
      setNewListName('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create wishlist', { theme: isDark ? 'dark' : 'light' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleAddToWishlist = async (wishlistId: string) => {
    setAddingTo(wishlistId);
    try {
      const { wishlist } = await api.addToWishlist(wishlistId, productId);
      setWishlists(wishlists.map((w) => (w._id === wishlist._id ? wishlist : w)));
      toast.success(`Added to ${wishlist.name}`, { theme: isDark ? 'dark' : 'light' });
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add to wishlist', { theme: isDark ? 'dark' : 'light' });
    } finally {
      setAddingTo(null);
    }
  };

  const isProductInWishlist = (wishlist: Wishlist) => {
    return wishlist.items.some((item) => item.product._id === productId);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-xl bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-lg font-semibold">Save to Wishlist</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-secondary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2">
          {wishlists.length === 0 ? (
            <p className="text-center text-muted-foreground py-4 text-sm">
              You don't have any wishlists yet.
            </p>
          ) : (
            wishlists.map((wishlist) => {
              const inList = isProductInWishlist(wishlist);
              return (
                <button
                  key={wishlist._id}
                  onClick={() => !inList && handleAddToWishlist(wishlist._id)}
                  disabled={inList || addingTo === wishlist._id}
                  className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-secondary/50 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <span className="font-medium">{wishlist.name}</span>
                  {addingTo === wishlist._id ? (
                    <span className="text-sm text-muted-foreground animate-pulse">Adding...</span>
                  ) : inList ? (
                    <Check className="h-5 w-5 text-primary" />
                  ) : (
                    <Plus className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>
              );
            })
          )}
        </div>

        <div className="border-t p-4 bg-secondary/20">
          <label className="text-sm font-medium mb-2 block">Create New Wishlist</label>
          <div className="flex gap-2">
            <Input
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="e.g., Summer Gear"
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateAndAdd();
              }}
            />
            <Button
              onClick={handleCreateAndAdd}
              disabled={!newListName.trim() || isCreating}
            >
              {isCreating ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
