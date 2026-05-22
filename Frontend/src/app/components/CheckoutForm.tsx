import { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { useNavigate } from 'react-router';
import { useApp } from '../context/AppContext';
import { api, ShippingInfo } from '../lib/api';
import { Button } from './ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';

interface CheckoutFormProps {
  state: {
    subtotal: number;
    tax: number;
    shippingCharges: number;
    discount: number;
    total: number;
    couponCode?: string;
  };
}

export function CheckoutForm({ state }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { cartItems, shippingAddress, clearCart, user } = useApp();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !shippingAddress) {
      return;
    }

    setIsProcessing(true);
    setMessage('');

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + '/orders',
        receipt_email: user?.email,
      },
      redirect: 'if_required',
    });

    if (error) {
      setMessage(error.message || 'An unexpected error occurred.');
      setIsProcessing(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      const shippingInfo: ShippingInfo = {
        address: shippingAddress.address,
        city: shippingAddress.city,
        state: shippingAddress.state,
        country: shippingAddress.country,
        pinCode: shippingAddress.pinCode,
      };

      try {
        await api.createOrder({
          shippingInfo,
          subtotal: state.subtotal,
          tax: state.tax,
          shippingCharges: state.shippingCharges,
          discount: state.discount,
          total: state.total,
          couponCode: state.couponCode,
          orderItems: cartItems.map((item) => ({
            name: item.name,
            photo: item.image,
            price: item.price,
            quantity: item.quantity,
            productId: item.id,
          })),
        });

        toast.success('Payment successful! Order placed.');
        clearCart();
        navigate('/orders', { replace: true });
      } catch (err) {
        setMessage(err instanceof Error ? err.message : 'Failed to place order after payment.');
        setIsProcessing(false);
      }
    } else {
      setMessage('Payment failed or requires additional action.');
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-card p-6 rounded-xl border shadow-sm space-y-6">
      <PaymentElement options={{ defaultValues: { billingDetails: { email: user?.email, name: user?.name } } }} />
      {message && <div className="text-destructive text-sm font-medium">{message}</div>}
      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full h-12 text-lg bg-gradient-to-r from-primary to-accent hover:opacity-90"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Processing...
          </>
        ) : (
          `Pay ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(state.total)}`
        )}
      </Button>
    </form>
  );
}
