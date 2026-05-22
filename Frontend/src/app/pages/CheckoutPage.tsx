import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import { CheckoutForm } from '../components/CheckoutForm';
import { Loader2 } from 'lucide-react';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_KEY || '');

export default function CheckoutPage() {
  const { user, cartItems, shippingAddress } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [clientSecret, setClientSecret] = useState<string>('');
  const [error, setError] = useState<string>('');

  const state = location.state as {
    subtotal: number;
    tax: number;
    shippingCharges: number;
    discount: number;
    total: number;
    couponCode?: string;
  };

  useEffect(() => {
    if (!state || cartItems.length === 0 || !shippingAddress || !user) {
      navigate('/cart', { replace: true });
      return;
    }

    const shippingInfo = {
      address: shippingAddress.address,
      city: shippingAddress.city,
      state: shippingAddress.state,
      country: shippingAddress.country,
      pinCode: shippingAddress.pinCode,
    };

    api.createPaymentIntent({
      orderItems: cartItems.map((item) => ({
        name: item.name,
        photo: item.image,
        price: item.price,
        quantity: item.quantity,
        productId: item.id,
      })),
      couponCode: state.couponCode,
      shippingInfo,
      userName: user.name,
      userEmail: user.email,
      description: `SportEquip order for ${cartItems.length} item type(s)`,
    })
      .then((res) => setClientSecret(res.clientSecret))
      .catch((err) => setError(err.message));
  }, [state, cartItems, shippingAddress, user, navigate]);

  if (!user || cartItems.length === 0 || !state) return null;

  return (
    <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl">
      <h2 className="text-3xl font-bold mb-6">Complete your Payment</h2>
      
      {error ? (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md border border-destructive/20 font-medium">
          {error}
        </div>
      ) : clientSecret ? (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CheckoutForm state={state} />
        </Elements>
      ) : (
        <div className="flex flex-col justify-center items-center h-48 space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium">Initializing secure checkout...</p>
        </div>
      )}
    </main>
  );
}
