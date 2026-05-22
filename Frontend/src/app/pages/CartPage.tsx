import { useNavigate } from 'react-router';
import { useApp } from '../context/AppContext';
import { Cart } from '../components/Cart';

export default function CartPage() {
  const { user, cartItems, shippingAddress, handleUpdateQuantity, handleRemoveItem, clearCart } = useApp();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <main className="flex-1">
      <Cart
        cartItems={cartItems}
        userId={user._id}
        userName={user.name}
        shippingAddress={shippingAddress}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onOrderPlaced={() => {
          clearCart();
          navigate('/orders');
        }}
        onNavigate={(page: string, state?: any) => {
          if (page === 'profile') navigate('/profile');
          else if (page === 'orders') navigate('/orders');
          else if (page === 'checkout') navigate('/checkout', { state });
          else navigate('/');
        }}
      />
    </main>
  );
}
