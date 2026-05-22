import { useApp } from '../context/AppContext';
import { MyOrders } from '../components/MyOrders';

export default function OrdersPage() {
  const { user } = useApp();

  return (
    <main className="flex-1">
      <MyOrders userId={user?._id} />
    </main>
  );
}
