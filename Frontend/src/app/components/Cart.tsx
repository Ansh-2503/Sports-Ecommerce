import { useMemo, useState, useEffect } from 'react';
import { Minus, Plus, Trash2, MapPin, AlertCircle, Tag, Ticket, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Separator } from './ui/separator';
import { Product } from './ProductCard';
import { ShippingAddress, api, formatCurrency, Coupon } from '../lib/api';

export interface CartItem extends Product {
  quantity: number;
}

interface CartProps {
  cartItems: CartItem[];
  userId?: string;
  userName?: string;
  shippingAddress: ShippingAddress | null;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onOrderPlaced: () => void;
  onNavigate: (page: string, state?: any) => void;
}

export function Cart({
  cartItems,
  userId,
  userName,
  shippingAddress,
  onUpdateQuantity,
  onRemoveItem,
  onOrderPlaced,
  onNavigate,
}: CartProps) {
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [eligibleCoupons, setEligibleCoupons] = useState<Coupon[]>([]);
  const [message, setMessage] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const subtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartItems]
  );
  
  useEffect(() => {
    if (cartItems.length === 0) return;
    const fetchEligibleCoupons = async () => {
      try {
        const categories = [...new Set(cartItems.map(item => item.category))];
        const products = cartItems.map(item => item.id);
        const { coupons } = await api.getEligibleCoupons({
          subtotal,
          categories,
          products
        });
        setEligibleCoupons(coupons);
      } catch {
        setEligibleCoupons([]);
      }
    };
    fetchEligibleCoupons();
  }, [subtotal, cartItems]);

  const calculateDiscount = (coupon: Coupon, currentSubtotal: number) => {
    if (coupon.discountType === 'percentage') {
      let calc = (currentSubtotal * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount && calc > coupon.maxDiscountAmount) {
        calc = coupon.maxDiscountAmount;
      }
      return Math.round(calc);
    } else {
      return Math.round(coupon.discountValue);
    }
  };

  const tax = Math.round(subtotal * 0.1);
  const shippingCharges = subtotal === 0 || subtotal > 999 ? 0 : Math.round(subtotal * 0.05);
  const discount = appliedCoupon ? Math.min(subtotal, calculateDiscount(appliedCoupon, subtotal)) : 0;
  const total = Math.max(0, subtotal + tax + shippingCharges - discount);
  const primaryCategory = cartItems[0]?.category;

  const applyCoupon = async (codeToApply?: string) => {
    const code = (codeToApply || couponCode).trim();
    if (!code) return;

    setIsApplyingCoupon(true);
    setMessage('');

    try {
      const { discount: coupon } = await api.applyCoupon(
        code,
        subtotal,
        primaryCategory
      );
      setAppliedCoupon(coupon);
      setCouponCode(coupon.code);
      setMessage(`Coupon ${coupon.code} applied successfully.`);
    } catch (error) {
      setAppliedCoupon(null);
      setMessage(error instanceof Error ? error.message : 'Coupon could not be applied.');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setMessage('Coupon removed.');
  };

  const proceedToCheckout = () => {
    if (!userId) {
      setMessage('Add your account ID before placing an order.');
      return;
    }

    if (!shippingAddress) {
      setMessage('Please add a shipping address in your profile before checkout.');
      return;
    }

    onNavigate('checkout', {
      subtotal,
      tax,
      shippingCharges,
      discount,
      total,
      couponCode: couponCode.trim() || undefined,
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 2xl:max-w-7xl min-h-[60vh]">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Shopping Cart</h2>
        <p className="text-muted-foreground">
          {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your cart
        </p>
      </div>

      {cartItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-16 bg-card rounded-xl border shadow-sm">
          <div className="h-24 w-24 bg-secondary/50 rounded-full flex items-center justify-center mb-6">
            <Trash2 className="h-10 w-10 text-muted-foreground opacity-50" />
          </div>
          <p className="text-xl font-medium text-foreground mb-2">Your cart is empty</p>
          <p className="text-muted-foreground mb-8 max-w-md">Looks like you haven't added anything to your cart yet. Browse our products to find the gear you need.</p>
          <Button size="lg" onClick={() => onNavigate('home')} className="px-8 shadow-sm">
            Continue Shopping
          </Button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Items */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-4">
            {cartItems.map((item) => (
              <div key={item.id} className="flex gap-4 sm:gap-6 rounded-xl bg-card border shadow-sm p-4 sm:p-5 transition-colors hover:border-primary/30">
                <div className="h-24 w-24 sm:h-32 sm:w-32 overflow-hidden rounded-lg bg-background flex-shrink-0 border">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <h4 className="text-base sm:text-lg font-semibold line-clamp-2 pr-2">{item.name}</h4>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 -mt-1 -mr-1 flex-shrink-0"
                        onClick={() => onRemoveItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-lg font-bold text-primary">
                      {formatCurrency(item.price)}
                    </p>
                  </div>

                  <div className="flex items-center mt-4">
                    <div className="flex items-center rounded-md border bg-background shadow-sm">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 sm:h-9 sm:w-9 rounded-none border-r hover:bg-secondary"
                        onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                      >
                        <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      <span className="text-sm sm:text-base w-10 sm:w-12 text-center font-medium">
                        {item.quantity}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 sm:h-9 sm:w-9 rounded-none border-l hover:bg-secondary"
                        onClick={() => onUpdateQuantity(item.id, Math.min(item.stock, item.quantity + 1))}
                        disabled={item.quantity >= item.stock}
                      >
                        <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Best Offers For You */}
            {eligibleCoupons.length > 0 && (
              <div className="rounded-xl border bg-card p-5 sm:p-6 shadow-sm mt-8">
                <div className="flex items-center gap-2 mb-5">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Tag className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg">Best Offers For You</h3>
                </div>
                
                <div className="grid gap-3">
                  {eligibleCoupons.map((coupon) => {
                    const isApplied = appliedCoupon?.code === coupon.code;
                    return (
                      <div 
                        key={coupon._id} 
                        className={`relative overflow-hidden p-4 sm:p-5 border rounded-xl transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                          isApplied 
                            ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20" 
                            : "bg-card hover:border-primary/40 hover:shadow-sm"
                        }`}
                      >
                        {/* Decorative side border for applied state */}
                        {isApplied && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-dashed border-primary/60 bg-primary/10 text-primary font-bold tracking-widest text-sm uppercase">
                              <Ticket className="h-3.5 w-3.5" />
                              {coupon.code}
                            </span>
                            {coupon.savings && coupon.savings > 0 && (
                              <span className="text-sm font-semibold text-success bg-success/10 px-2 py-0.5 rounded-full">
                                Save {formatCurrency(coupon.savings)}
                              </span>
                            )}
                          </div>
                          <h4 className="font-medium text-foreground text-base truncate">{coupon.title}</h4>
                          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{coupon.description}</p>
                        </div>

                        <div className="w-full sm:w-auto flex-shrink-0">
                          {isApplied ? (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={removeCoupon} 
                              className="w-full sm:w-auto text-destructive border-destructive/50 hover:bg-destructive/10 hover:border-destructive gap-1.5"
                            >
                              <CheckCircle2 className="h-4 w-4 text-primary" />
                              <span className="text-foreground">Applied</span>
                              <span className="text-destructive ml-1 text-xs font-normal border-l border-destructive/20 pl-2">Remove</span>
                            </Button>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="secondary" 
                              onClick={() => applyCoupon(coupon.code)} 
                              disabled={isApplyingCoupon}
                              className="w-full sm:w-auto shadow-sm"
                            >
                              Apply Coupon
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Shipping Info & Summary */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6 sticky top-24">

            {/* Shipping Address (read-only summary) */}
            <div className="rounded-xl border bg-card p-5 sm:p-6 shadow-sm">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Deliver To
              </h3>
              {shippingAddress ? (
                <div className="space-y-2">
                  <p className="text-sm text-foreground leading-relaxed">
                    {shippingAddress.address}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {shippingAddress.city}, {shippingAddress.state} — {shippingAddress.pinCode}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {shippingAddress.country}
                  </p>
                  <Button
                    variant="link"
                    size="sm"
                    className="px-0 h-auto text-primary"
                    onClick={() => onNavigate('profile')}
                  >
                    Change Address
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20">
                    <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-destructive">
                      No shipping address on file. Please add one in your profile before checkout.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onNavigate('profile')}
                    className="w-full"
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Add Shipping Address
                  </Button>
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="rounded-xl border bg-card p-5 sm:p-6 shadow-sm">
              <h3 className="font-semibold text-lg mb-4">Order Summary</h3>
              
              <div className="flex gap-2 mb-6">
                <Input
                  placeholder="Coupon code"
                  value={couponCode}
                  onChange={(event) => setCouponCode(event.target.value)}
                  disabled={!!appliedCoupon}
                  className="bg-background border-muted-foreground/20 focus-visible:ring-primary/30 flex-1"
                />
                {appliedCoupon ? (
                  <Button 
                    variant="outline" 
                    onClick={removeCoupon} 
                    className="shadow-sm border-destructive text-destructive hover:bg-destructive/10"
                  >
                    Remove
                  </Button>
                ) : (
                  <Button 
                    variant="secondary" 
                    onClick={() => applyCoupon()} 
                    disabled={isApplyingCoupon || !couponCode.trim()}
                    className="shadow-sm"
                  >
                    {isApplyingCoupon ? 'Applying' : 'Apply'}
                  </Button>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax (10%)</span>
                  <span className="font-medium">{formatCurrency(tax)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium">{shippingCharges === 0 ? 'Free' : formatCurrency(shippingCharges)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-success bg-success/10 px-2 py-1 -mx-2 rounded">
                    <span>Discount</span>
                    <span className="font-medium">-{formatCurrency(discount)}</span>
                  </div>
                )}
                
                <Separator className="my-4" />
                
                <div className="flex justify-between items-center mb-6">
                  <span className="font-semibold text-base">Total</span>
                  <span className="font-bold text-2xl sm:text-3xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    {formatCurrency(total)}
                  </span>
                </div>

                {message && (
                  <div className="p-3 mb-4 rounded-md bg-secondary/50 border text-sm text-center font-medium">
                    {message}
                  </div>
                )}

                <Button
                  className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 h-12 text-lg shadow-md transition-opacity"
                  size="lg"
                  onClick={proceedToCheckout}
                  disabled={!shippingAddress}
                >
                  Proceed to Checkout
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
