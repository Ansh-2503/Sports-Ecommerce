import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router';
import {
  ShoppingCart,
  Search,
  Menu,
  X,
  User as UserIcon,
  Heart,
  Moon,
  Sun,
  Grid3X3,
  ReceiptText,
  LogOut,
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { getAssetUrl } from '../lib/api';
import { useApp } from '../context/AppContext';

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    user,
    isAdmin,
    isDark,
    toggleTheme,
    totalCartItems,
    handleLogout,
    setIsAuthModalOpen,
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileSearchTerm, setMobileSearchTerm] = useState('');
  const headerRef = useRef<HTMLElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    }
    if (mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mobileMenuOpen]);

  // Auto-focus mobile search input when it opens
  useEffect(() => {
    if (mobileSearchOpen) {
      // Small delay so the CSS transition starts before focus
      const id = setTimeout(() => mobileSearchInputRef.current?.focus(), 50);
      return () => clearTimeout(id);
    } else {
      setMobileSearchTerm('');
    }
  }, [mobileSearchOpen]);

  const handleMobileSearchSubmit = useCallback(() => {
    const term = mobileSearchTerm.trim();
    if (!term) return;
    setMobileSearchOpen(false);
    navigate(`/search?q=${encodeURIComponent(term)}`);
  }, [mobileSearchTerm, navigate]);

  const closeMobileSearch = useCallback(() => {
    setMobileSearchOpen(false);
  }, []);

  const currentPath = location.pathname;

  const handleCartClick = () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    navigate('/cart');
  };

  const handleAuthNavigate = (path: string) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    navigate(path);
  };

  const onLogout = async () => {
    await handleLogout();
    navigate('/');
  };

  return (
    <header ref={headerRef} className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <button className="lg:hidden relative h-6 w-6" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <Menu className={`absolute inset-0 h-6 w-6 transition-all duration-300 ease-in-out ${mobileMenuOpen ? 'rotate-90 opacity-0 scale-50' : 'rotate-0 opacity-100 scale-100'}`} />
              <X className={`absolute inset-0 h-6 w-6 transition-all duration-300 ease-in-out ${mobileMenuOpen ? 'rotate-0 opacity-100 scale-100' : '-rotate-90 opacity-0 scale-50'}`} />
            </button>

            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-primary-foreground font-bold">SE</span>
              </div>
              <h1 className="text-xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                SportEquip
              </h1>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search products..."
                  value={localSearchTerm}
                  onChange={(e) => setLocalSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && localSearchTerm.trim()) {
                      navigate(`/search?q=${encodeURIComponent(localSearchTerm.trim())}`);
                    }
                  }}
                  className="pl-9 bg-secondary border-0 focus-visible:ring-primary"
                />
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              title="My orders"
              aria-label="My orders"
              className={`hidden md:flex ${currentPath === '/orders' ? 'bg-secondary' : ''}`}
              onClick={() => handleAuthNavigate('/orders')}
            >
              <ReceiptText className="h-5 w-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              title="Wishlist"
              aria-label="Wishlist"
              className={`hidden md:flex ${currentPath === '/wishlists' ? 'bg-secondary' : ''}`}
              onClick={() => handleAuthNavigate('/wishlists')}
            >
              <Heart className="h-5 w-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              title="Theme"
              aria-label="Theme"
              className="hidden md:flex"
              onClick={toggleTheme}
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              title="Cart"
              aria-label="Cart"
              className="relative hidden md:flex"
              onClick={handleCartClick}
            >
              <ShoppingCart className="h-5 w-5" />
              {totalCartItems > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-accent">
                  {totalCartItems}
                </Badge>
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              title={mobileSearchOpen ? 'Close search' : 'Search'}
              aria-label={mobileSearchOpen ? 'Close search' : 'Open search'}
              aria-expanded={mobileSearchOpen}
              className="md:hidden flex"
              onClick={() => setMobileSearchOpen((prev) => !prev)}
            >
              {mobileSearchOpen
                ? <X className="h-5 w-5" />
                : <Search className="h-5 w-5" />}
            </Button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="flex items-center justify-center h-9 w-9 rounded-md hover:bg-accent hover:text-accent-foreground outline-none transition-colors"
                  title="Account"
                  aria-label="Account"
                >
                  <img
                    src={getAssetUrl(user.photo, user.name)}
                    alt={user.name}
                    className="h-6 w-6 rounded-full object-cover"
                  />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {isAdmin && (
                    <>
                      <DropdownMenuItem onClick={() => navigate('/admin/overview')} className="cursor-pointer">
                        <Grid3X3 className="mr-2 h-4 w-4" />
                        <span>Admin Dashboard</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Edit Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={onLogout}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => setIsAuthModalOpen(true)}
              >
                <UserIcon className="h-4 w-4" />
                Sign In
              </Button>
            )}

          </div>
        </div>

        </div>

        {/* ── Mobile search bar overlay ───────────────────────────────────────
            Slides in below the main header row on small screens only.
            Hidden on md+ because those screens already show the inline bar.
        ──────────────────────────────────────────────────────────────────── */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            mobileSearchOpen
              ? 'max-h-20 opacity-100 py-2 border-t'
              : 'max-h-0 opacity-0 py-0 border-transparent'
          }`}
          aria-hidden={!mobileSearchOpen}
        >
          <div className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                ref={mobileSearchInputRef}
                type="search"
                role="searchbox"
                aria-label="Search products"
                placeholder="Search products..."
                value={mobileSearchTerm}
                onChange={(e) => setMobileSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleMobileSearchSubmit();
                  if (e.key === 'Escape') closeMobileSearch();
                }}
                className="w-full h-10 rounded-md bg-secondary pl-9 pr-4 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-primary focus:ring-offset-0 border-0 placeholder:text-muted-foreground"
              />
            </div>
            <Button
              size="sm"
              onClick={handleMobileSearchSubmit}
              disabled={!mobileSearchTerm.trim()}
              className="h-10 px-4 shrink-0"
            >
              Search
            </Button>
          </div>
        </div>

        <div className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${mobileMenuOpen ? 'max-h-[500px] opacity-100 py-4 border-t' : 'max-h-0 opacity-0 py-0 border-transparent'}`}>
          <nav className="flex flex-col gap-4">
              {/* General Options */}
              <button
                className="text-sm hover:text-primary transition-colors text-left flex items-center justify-between gap-2 py-1"
                onClick={() => {
                  handleCartClick();
                  setMobileMenuOpen(false);
                }}
              >
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Cart
                </div>
                {totalCartItems > 0 && (
                  <Badge className="h-5 w-5 flex items-center justify-center p-0 text-xs bg-accent">
                    {totalCartItems}
                  </Badge>
                )}
              </button>
              <button
                className="text-sm hover:text-primary transition-colors text-left flex items-center gap-2 py-1"
                onClick={() => {
                  handleAuthNavigate('/orders');
                  setMobileMenuOpen(false);
                }}
              >
                <ReceiptText className="h-4 w-4" />
                My Orders
              </button>

              <button
                className="text-sm hover:text-primary transition-colors text-left flex items-center gap-2 py-1"
                onClick={() => {
                  handleAuthNavigate('/wishlists');
                  setMobileMenuOpen(false);
                }}
              >
                <Heart className="h-4 w-4" />
                Wishlist
              </button>

              <button
                className="text-sm hover:text-primary transition-colors text-left flex items-center gap-2 py-1"
                onClick={() => {
                  toggleTheme();
                  setMobileMenuOpen(false);
                }}
              >
                {isDark ? (
                  <>
                    <Sun className="h-4 w-4" />
                    Light Mode
                  </>
                ) : (
                  <>
                    <Moon className="h-4 w-4" />
                    Dark Mode
                  </>
                )}
              </button>

              {user && (
                <>
                  <div className="text-sm font-semibold text-muted-foreground pt-4 border-t">
                    Account ({user.name})
                  </div>
                  {isAdmin && (
                    <button
                      className="text-sm hover:text-primary transition-colors text-left flex items-center gap-2 py-1"
                      onClick={() => {
                        navigate('/admin/overview');
                        setMobileMenuOpen(false);
                      }}
                    >
                      <Grid3X3 className="h-4 w-4" />
                      Admin Dashboard
                    </button>
                  )}
                  <button
                    className="text-sm hover:text-primary transition-colors text-left flex items-center gap-2 py-1"
                    onClick={() => {
                      navigate('/profile');
                      setMobileMenuOpen(false);
                    }}
                  >
                    <UserIcon className="h-4 w-4" />
                    Edit Profile
                  </button>
                  <button
                    className="text-sm hover:text-destructive transition-colors text-left flex items-center gap-2 py-1"
                    onClick={() => {
                      onLogout();
                      setMobileMenuOpen(false);
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </>
              )}
            </nav>
          </div>
      </header>
  );
}
