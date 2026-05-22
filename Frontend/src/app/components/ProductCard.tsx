import { useState } from 'react';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import { Card, CardContent, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { formatCurrency } from '../lib/api';
import { WishlistModal } from './WishlistModal';
import { useApp } from '../context/AppContext';

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  image: string;
  category: string;
  inStock: boolean;
  stock: number;
  isNew?: boolean;
  discount?: number;
}

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const { user, setIsAuthModalOpen, wishlists } = useApp();
  const [isWishlistModalOpen, setIsWishlistModalOpen] = useState(false);

  const isInWishlist = wishlists?.some((w) =>
    w.items.some((item) => item.product._id === product.id)
  );

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    setIsWishlistModalOpen(true);
  };

  return (
    <>
      <Card className="group overflow-hidden hover:shadow-2xl transition-all hover:-translate-y-1 border-0 shadow-md h-full flex flex-col">
        <div className="relative aspect-square overflow-hidden bg-secondary/30">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        {product.isNew && (
          <Badge className="absolute top-3 left-3 bg-gradient-to-r from-primary to-accent border-0">New</Badge>
        )}
        {product.discount && (
          <Badge className="absolute top-3 right-3 bg-destructive border-0">-{product.discount}%</Badge>
        )}
        <Button
          size="icon"
          variant="outline"
          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all rounded-full shadow-md bg-background/80 backdrop-blur-sm border-border hover:bg-background"
          onClick={handleWishlistClick}
        >
          <svg width="0" height="0" className="absolute">
            <linearGradient id={`heartGradient-${product.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop stopColor="var(--primary)" offset="0%" />
              <stop stopColor="var(--accent)" offset="100%" />
            </linearGradient>
          </svg>
          <Heart 
            className="h-4 w-4" 
            fill={isInWishlist ? `url(#heartGradient-${product.id})` : 'none'} 
            stroke={isInWishlist ? `url(#heartGradient-${product.id})` : 'currentColor'}
          />
        </Button>
      </div>

      <CardContent className="p-4 flex-grow flex flex-col">
        <div>
          <p className="text-xs text-muted-foreground mb-1">{product.category}</p>
          <h3 className="mb-2 line-clamp-2">{product.name}</h3>
        </div>

        <div className="mt-auto">

        <div className="flex items-center gap-1 mb-2">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-3 w-3 ${
                  i < Math.floor(product.rating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-muted'
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">({product.reviews})</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-lg">{formatCurrency(product.price)}</span>
          {product.originalPrice && (
            <span className="text-sm text-muted-foreground line-through">
              {formatCurrency(product.originalPrice)}
            </span>
          )}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {product.stock > 0 ? `${product.stock} in stock` : 'Currently unavailable'}
        </p>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button
          className="w-full gap-2"
          onClick={() => onAddToCart(product)}
          disabled={!product.inStock}
        >
          <ShoppingCart className="h-4 w-4" />
          {product.inStock ? 'Add to Cart' : 'Out of Stock'}
        </Button>
      </CardFooter>
    </Card>
    <WishlistModal
      isOpen={isWishlistModalOpen}
      onClose={() => setIsWishlistModalOpen(false)}
      productId={product.id}
    />
    </>
  );
}
