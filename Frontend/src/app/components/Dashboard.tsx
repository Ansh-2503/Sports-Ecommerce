import { useEffect, useState } from 'react';
import { Package, IndianRupee, ShoppingBag, Activity, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Badge } from './ui/badge';
import { Order, api, formatCurrency } from '../lib/api';

interface DashboardProps {
  adminId?: string;
}

export function Dashboard({ adminId }: DashboardProps) {
  const [stats, setStats] = useState<Awaited<ReturnType<typeof api.getDashboardStats>>['stats'] | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!adminId) return;

    let ignore = false;
    setIsLoading(true);
    setError('');

    Promise.all([api.getDashboardStats(), api.getAllOrders()])
      .then(([statsResponse, ordersResponse]) => {
        if (ignore) return;
        setStats(statsResponse.stats);
        setOrders(ordersResponse.orders);
      })
      .catch((caughtError) => {
        if (!ignore) {
          setError(caughtError instanceof Error ? caughtError.message : 'Dashboard could not be loaded.');
        }
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [adminId]);

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

  if (!adminId) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="border-0 shadow-md">
          <CardContent className="p-8">
            <h1 className="mb-2">Admin Panel</h1>
            <p className="text-muted-foreground">Load an admin account to view store performance.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(stats?.count.revenue || 0),
      change: `${stats?.changePercent.revenue || 0}%`,
      icon: IndianRupee,
    },
    {
      title: 'Total Orders',
      value: String(stats?.count.order || 0),
      change: `${stats?.changePercent.order || 0}%`,
      icon: ShoppingBag,
    },
    {
      title: 'Products',
      value: String(stats?.count.product || 0),
      change: `${stats?.changePercent.product || 0}%`,
      icon: Package,
    },
    {
      title: 'Users',
      value: String(stats?.count.user || 0),
      change: `${stats?.changePercent.user || 0}%`,
      icon: Users,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2">Admin Panel</h1>
        <p className="text-muted-foreground">Live store overview from the backend API.</p>
      </div>

      {error && (
        <Card className="mb-6 border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <Badge className="bg-success/10 text-success border-0">
                    {isLoading ? '...' : stat.change}
                  </Badge>
                </div>
                <h3 className="text-2xl mb-1">{isLoading ? '...' : stat.value}</h3>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-2 border-0 shadow-md">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.slice(0, 6).map((order) => (
                  <TableRow key={order._id}>
                    <TableCell className="font-medium">#{order._id.slice(-6).toUpperCase()}</TableCell>
                    <TableCell>
                      {typeof order.user === 'object' ? order.user.name : order.user}
                    </TableCell>
                    <TableCell>{order.orderItems.length}</TableCell>
                    <TableCell>{formatCurrency(order.total)}</TableCell>
                    <TableCell>
                      <Badge className={`${getStatusColor(order.status)} border-0`}>
                        {order.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {!isLoading && orders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      No orders yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Latest Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(stats?.latestTransaction || []).map((transaction) => (
                <div key={transaction._id} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">#{transaction._id.slice(-6).toUpperCase()}</p>
                    <p className="text-xs text-muted-foreground">
                      {transaction.quantity} item type(s)
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatCurrency(transaction.amount)}</p>
                    <Badge className={`${getStatusColor(transaction.status)} border-0 mt-1`}>
                      {transaction.status}
                    </Badge>
                  </div>
                </div>
              ))}
              {!isLoading && !stats?.latestTransaction?.length && (
                <p className="text-sm text-muted-foreground">No transactions yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
