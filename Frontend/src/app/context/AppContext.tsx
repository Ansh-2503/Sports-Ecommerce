import { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { toast } from 'react-toastify';
import { ApiProduct, CategorySummary, ShippingAddress, UserProfile, Wishlist, api, getAssetUrl, API_BASE_URL } from '../lib/api';
import { Product } from '../components/ProductCard';
import { CartItem } from '../components/Cart';
import { Dumbbell, Bike, Activity, Trophy, Watch, Target, CircleDot } from 'lucide-react';

const PRIMARY_CATEGORIES = [
  { name: 'Fitness', icon: Dumbbell },
  { name: 'Cycling', icon: Bike },
  { name: 'Running', icon: Activity },
  { name: 'Team Sports', icon: Trophy },
  { name: 'Wearables', icon: Watch },
  { name: 'Training', icon: Target },
];

function toProduct(product: ApiProduct): Product {
  return {
    id: product._id,
    name: product.name,
    price: product.price,
    rating: 4.6,
    reviews: 0,
    image: getAssetUrl(product.photo),
    category: product.category,
    inStock: product.stock > 0,
    stock: product.stock,
    isNew: product.createdAt
      ? Date.now() - new Date(product.createdAt).getTime() < 1000 * 60 * 60 * 24 * 14
      : false,
  };
}

interface AppContextValue {
  // Auth
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  isAdmin: boolean;
  handleLogout: () => Promise<void>;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  isAuthLoading: boolean;

  // Theme
  isDark: boolean;
  toggleTheme: () => void;

  // Cart
  cartItems: CartItem[];
  totalCartItems: number;
  handleAddToCart: (product: Product) => void;
  handleUpdateQuantity: (id: string, quantity: number) => void;
  handleRemoveItem: (id: string) => void;
  clearCart: () => void;

  // Products
  products: Product[];
  isLoadingProducts: boolean;
  productError: string;
  retryProducts: () => void;

  // Categories
  categories: CategorySummary[];
  displayedCategories: (CategorySummary & { icon: import('lucide-react').LucideIcon })[];
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;

  // Shipping Address
  shippingAddress: ShippingAddress | null;
  setShippingAddress: (addr: ShippingAddress | null) => void;
  fetchShippingAddress: () => Promise<void>;

  // Wishlist
  wishlists: Wishlist[];
  setWishlists: (wishlists: Wishlist[]) => void;
  fetchWishlists: () => Promise<void>;
  isWishlistLoading: boolean;

  // New user flag (post-registration redirect)
  isNewUser: boolean;
  setIsNewUser: (val: boolean) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isDark, setIsDark] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [productError, setProductError] = useState('');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress | null>(null);
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

  // ── Keepalive: wake the Render dyno before any real request fires ──────────
  useEffect(() => {
    fetch(`${API_BASE_URL}/ping`, { method: 'GET' }).catch(() => {});
  }, []);

  // Theme initialization
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    setIsDark(shouldBeDark);
    if (shouldBeDark) document.documentElement.classList.add('dark');
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('sportequip-access-token');
    if (!token) {
      setIsAuthLoading(false);
      return;
    }
    api.getMe()
      .then(({ user }) => {
        setUser(user);
        setIsAuthLoading(false);

        api.getShippingAddress()
          .then(({ shippingAddress }) => setShippingAddress(shippingAddress))
          .catch(() => setShippingAddress(null));

        api.getWishlists()
          .then(({ wishlists }) => setWishlists(wishlists))
          .catch(() => setWishlists([]));
      })
      .catch(() => {
        localStorage.removeItem('sportequip-access-token');
        setIsAuthLoading(false);
      });
  }, []);

  // Categories fetch
  useEffect(() => {
    let ignore = false;
    api.getCategories()
      .then(({ categories, categoryDetails }) => {
        if (ignore) return;
        setCategories(
          categoryDetails?.length
            ? categoryDetails
            : categories.map((name) => ({ name, itemCount: 0 }))
        );
      })
      .catch(() => { if (!ignore) setCategories([]); });
    return () => { ignore = true; };
  }, []);

  // Products fetch
  useEffect(() => {
    let ignore = false;
    setIsLoadingProducts(true);
    setProductError('');
    api.getProducts({ category: selectedCategory === 'all' ? undefined : selectedCategory, page: 1 })
      .then(({ products }) => { if (!ignore) setProducts(products.map(toProduct)); })
      .catch((error) => {
        if (!ignore) {
          setProducts([]);
          setProductError(error instanceof Error ? error.message : 'Products could not be loaded.');
        }
      })
      .finally(() => { if (!ignore) setIsLoadingProducts(false); });
    return () => { ignore = true; };
  }, [selectedCategory]);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
      return next;
    });
  }, []);

  const handleLogout = useCallback(async () => {
    try { await api.logout(); } catch { /* ignore */ }
    finally {
      localStorage.removeItem('sportequip-access-token');
      setUser(null);
      setShippingAddress(null);
      setWishlists([]);
      setIsNewUser(false);
    }
  }, []);

  const fetchShippingAddress = useCallback(async () => {
    try {
      const { shippingAddress } = await api.getShippingAddress();
      setShippingAddress(shippingAddress);
    } catch {
      setShippingAddress(null);
    }
  }, []);

  const fetchWishlists = useCallback(async () => {
    setIsWishlistLoading(true);
    try {
      const { wishlists } = await api.getWishlists();
      setWishlists(wishlists);
    } catch {
      setWishlists([]);
    } finally {
      setIsWishlistLoading(false);
    }
  }, []);

  const handleAddToCart = useCallback((product: Product) => {
    if (!user) {
      toast.error('Please log in to continue shopping.', { theme: isDark ? 'dark' : 'light' });
      setIsAuthModalOpen(true);
      return;
    }
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: Math.min(item.stock, item.quantity + 1) }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    toast.success('Added to cart', { theme: isDark ? 'dark' : 'light' });
  }, [user, isDark]);

  const handleUpdateQuantity = useCallback((id: string, quantity: number) => {
    setCartItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: Math.min(item.stock, quantity) } : item))
    );
  }, []);

  const handleRemoveItem = useCallback((id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearCart = useCallback(() => setCartItems([]), []);

  const retryProducts = useCallback(() => {
    setIsLoadingProducts(true);
    setProductError('');
    api
      .getProducts({ category: selectedCategory, page: 1 })
      .then(({ products }) => setProducts(products.map(toProduct)))
      .catch((error) => {
        setProducts([]);
        setProductError(error instanceof Error ? error.message : 'Products could not be loaded.');
      })
      .finally(() => setIsLoadingProducts(false));
  }, [selectedCategory]);

  const totalCartItems = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );

  const displayedCategories = useMemo(() => {
    return PRIMARY_CATEGORIES.map(cat => {
      const apiCat = categories.find(c => c.name.toLowerCase() === cat.name.toLowerCase());
      return {
        name: cat.name,
        icon: cat.icon,
        itemCount: apiCat ? apiCat.itemCount : 0
      };
    });
  }, [categories]);

  const isAdmin = useMemo(() => user?.role === 'admin', [user]);

  const value = useMemo<AppContextValue>(
    () => ({
      user,
      setUser,
      isAdmin,
      handleLogout,
      isAuthModalOpen,
      setIsAuthModalOpen,
      isAuthLoading,
      isDark,
      toggleTheme,
      cartItems,
      totalCartItems,
      handleAddToCart,
      handleUpdateQuantity,
      handleRemoveItem,
      clearCart,
      products,
      isLoadingProducts,
      productError,
      retryProducts,
      categories,
      displayedCategories,
      selectedCategory,
      setSelectedCategory,
      shippingAddress,
      setShippingAddress,
      fetchShippingAddress,
      wishlists,
      setWishlists,
      fetchWishlists,
      isWishlistLoading,
      isNewUser,
      setIsNewUser,
    }),
    [
      user,
      setUser,
      isAdmin,
      handleLogout,
      isAuthModalOpen,
      setIsAuthModalOpen,
      isAuthLoading,
      isDark,
      toggleTheme,
      cartItems,
      totalCartItems,
      handleAddToCart,
      handleUpdateQuantity,
      handleRemoveItem,
      clearCart,
      products,
      isLoadingProducts,
      productError,
      retryProducts,
      categories,
      displayedCategories,
      selectedCategory,
      setSelectedCategory,
      shippingAddress,
      setShippingAddress,
      fetchShippingAddress,
      wishlists,
      setWishlists,
      fetchWishlists,
      isWishlistLoading,
      isNewUser,
      setIsNewUser,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
