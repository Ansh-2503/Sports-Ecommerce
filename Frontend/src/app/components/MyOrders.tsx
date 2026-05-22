import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { PackageOpen, ExternalLink } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Order, api, formatCurrency } from '../lib/api';
import { Separator } from './ui/separator';

interface MyOrdersProps {
  userId?: string;
}

export function MyOrders({ userId }: MyOrdersProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) return;

    let ignore = false;
    setIsLoading(true);
    setError('');

    api.getMyOrders()
      .then(({ orders }) => {
        if (!ignore) setOrders(orders);
      })
      .catch((caughtError) => {
        if (!ignore) {
          setError(caughtError instanceof Error ? caughtError.message : 'Orders could not be loaded.');
        }
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [userId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered':
        return 'bg-success text-success-foreground';
      case 'Shipped':
        return 'bg-primary text-primary-foreground';
      case 'Processing':
        return 'bg-warning text-warning-foreground';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  if (!userId) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="border-0 shadow-md">
          <CardContent className="flex flex-col items-center p-8 text-center">
            <PackageOpen className="mb-4 h-12 w-12 text-primary" />
            <h1 className="mb-2">My Orders</h1>
            <p className="text-muted-foreground">Load your account to see your order history.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 2xl:max-w-7xl">
      <div className="mb-8">
        <h1 className="mb-2">My Orders</h1>
        <p className="text-muted-foreground">Track your purchases and fulfillment status.</p>
      </div>

      {error && (
        <Card className="mb-6 border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Order History</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Ship To</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order._id}>
                    <TableCell className="font-medium">#{order._id.slice(-6).toUpperCase()}</TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate">
                        {order.orderItems.map((item) => item.name).join(', ')}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {order.orderItems.reduce((sum, item) => sum + item.quantity, 0)} item(s)
                      </p>
                    </TableCell>
                    <TableCell>{order.shippingInfo.city}, {order.shippingInfo.state}</TableCell>
                    <TableCell>{formatCurrency(order.total)}</TableCell>
                    <TableCell>
                      <Badge className={`${getStatusColor(order.status)} border-0`}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-primary border-primary/30 hover:bg-primary/10 hover:border-primary/60 transition-colors"
                        onClick={() => navigate(`/orders/${order._id}`)}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      Loading orders...
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && orders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      No orders yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden flex flex-col gap-4 p-4 sm:p-0">
            {isLoading ? (
              <div className="py-8 text-center text-muted-foreground">Loading orders...</div>
            ) : orders.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">No orders yet.</div>
            ) : (
              orders.map((order) => (
                <Card key={order._id} className="border bg-card shadow-sm overflow-hidden">
                  <div className="p-4 bg-muted/30 border-b flex justify-between items-center">
                    <div>
                      <p className="text-xs text-muted-foreground">Order ID</p>
                      <p className="font-bold text-sm">#{order._id.slice(-6).toUpperCase()}</p>
                    </div>
                    <Badge className={`${getStatusColor(order.status)} border-0 shadow-sm`}>
                      {order.status}
                    </Badge>
                  </div>
                  <div className="p-4 space-y-4">
                    <div>
                      <p className="text-sm font-medium line-clamp-2 mb-1">
                        {order.orderItems.map((item) => item.name).join(', ')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {order.orderItems.reduce((sum, item) => sum + item.quantity, 0)} item(s) • Ship to {order.shippingInfo.city}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Total Amount</p>
                        <p className="font-bold text-base text-primary">{formatCurrency(order.total)}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-primary border-primary/30 hover:bg-primary/10 transition-colors"
                        onClick={() => navigate(`/orders/${order._id}`)}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Details
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
