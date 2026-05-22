import React, { useEffect, useState } from "react";
import {
  IndianRupee,
  Users,
  ShoppingBag,
  Package,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { AdminLayout } from "../../components/AdminLayout";
import { api, AdminDashboardStats, formatCurrency } from "../../lib/api";
import { ChartSkeleton, ErrorState } from "../../components/feedback/PageState";

export default function Overview() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getDashboardStats()
      .then((res) => {
        setStats(res.stats);
      })
      .catch((err) => {
        setError(err.message || "Failed to fetch stats");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Overview</h2>
            <p className="text-muted-foreground">Welcome back to your dashboard.</p>
          </div>
          {/* Stat card skeletons */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border-0 shadow-md bg-card p-6 space-y-4 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="h-9 w-9 rounded-lg bg-secondary/70" />
                  <div className="h-5 w-12 rounded-full bg-secondary/50" />
                </div>
                <div className="space-y-2 mt-4">
                  <div className="h-3.5 w-24 rounded bg-secondary/50" />
                  <div className="h-7 w-32 rounded bg-secondary/70" />
                </div>
              </div>
            ))}
          </div>
          <ChartSkeleton rows={1} />
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Overview</h2>
            <p className="text-muted-foreground">Welcome back to your dashboard.</p>
          </div>
          <ErrorState title="Failed to load dashboard" message={error} onRetry={() => window.location.reload()} />
        </div>
      </AdminLayout>
    );
  }

  if (!stats) return null;

  const cardData = [
    {
      title: "Total Revenue",
      value: formatCurrency(stats.count.revenue),
      change: stats.changePercent.revenue,
      icon: IndianRupee,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      title: "Total Users",
      value: stats.count.user,
      change: stats.changePercent.user,
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "Total Orders",
      value: stats.count.order,
      change: stats.changePercent.order,
      icon: ShoppingBag,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      title: "Inventory Items",
      value: stats.count.product,
      change: stats.changePercent.product,
      icon: Package,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
    },
  ];

  // Prepare chart data
  const revenueChartData = stats.chart.revenue.map((val, i) => ({
    name: `Month ${i + 1}`,
    revenue: val,
    transactions: stats.chart.order[i],
  }));

  const inventoryData = stats.categoryCount.map((cat) => {
    const [name, count] = Object.entries(cat)[0];
    return { name, count };
  });

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Overview</h2>
          <p className="text-muted-foreground">Welcome back to your dashboard.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {cardData.map((item) => (
            <Card key={item.title} className="border-0 shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                  <div className={`p-2 rounded-lg ${item.bg}`}>
                    <item.icon className={`h-5 w-5 ${item.color}`} />
                  </div>
                  <Badge
                    variant="outline"
                    className={`border-0 flex items-center gap-1 ${
                      item.change >= 0
                        ? "text-emerald-500 bg-emerald-500/10"
                        : "text-destructive bg-destructive/10"
                    }`}
                  >
                    {item.change >= 0 ? (
                      <ArrowUpRight className="h-3 w-3" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3" />
                    )}
                    {Math.abs(item.change)}%
                  </Badge>
                </div>
                <div className="mt-4">
                  <p className="text-sm font-medium text-muted-foreground">{item.title}</p>
                  <h3 className="text-2xl font-bold">{item.value}</h3>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          {/* Revenue & Transaction Graph */}
          <Card className="lg:col-span-4 border-0 shadow-md">
            <CardHeader>
              <CardTitle>Revenue & Transactions</CardTitle>
            </CardHeader>
            <CardContent className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChartData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#888" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#888" }} />
                  <Tooltip
                    contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Inventory Bar Chart */}
          <Card className="lg:col-span-3 border-0 shadow-md">
            <CardHeader>
              <CardTitle>Inventory by Category</CardTitle>
            </CardHeader>
            <CardContent className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={inventoryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={80} />
                  <Tooltip
                    cursor={{ fill: "transparent" }}
                    contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                  />
                  <Bar dataKey="count" fill="#fbbf24" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Last Transactions */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Last Transactions</CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.latestTransaction.map((tx) => (
                    <TableRow key={tx._id}>
                      <TableCell className="font-medium font-mono text-xs uppercase">
                        #{tx._id.slice(-6)}
                      </TableCell>
                      <TableCell className="font-bold">{formatCurrency(tx.amount)}</TableCell>
                      <TableCell>{tx.quantity}</TableCell>
                      <TableCell className="text-destructive">-{formatCurrency(tx.discount)}</TableCell>
                      <TableCell>
                        <Badge
                          className={`border-0 ${
                            tx.status === "Delivered"
                              ? "bg-emerald-500 text-white"
                              : tx.status === "Shipped"
                              ? "bg-blue-500 text-white"
                              : "bg-orange-500 text-white"
                          }`}
                        >
                          {tx.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden flex flex-col gap-4 p-4 sm:p-0">
              {stats.latestTransaction.length === 0 ? (
                <div className="py-4 text-center text-muted-foreground text-sm">No recent transactions.</div>
              ) : (
                stats.latestTransaction.map((tx) => (
                  <Card key={tx._id} className="border shadow-sm overflow-hidden bg-background">
                    <div className="p-3 border-b bg-muted/30 flex justify-between items-center">
                      <span className="font-medium font-mono text-xs uppercase">#{tx._id.slice(-6)}</span>
                      <Badge
                        className={`border-0 ${
                          tx.status === "Delivered"
                            ? "bg-emerald-500 text-white"
                            : tx.status === "Shipped"
                            ? "bg-blue-500 text-white"
                            : "bg-orange-500 text-white"
                        }`}
                      >
                        {tx.status}
                      </Badge>
                    </div>
                    <div className="p-3 space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Amount</span>
                        <span className="font-bold">{formatCurrency(tx.amount)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Items</span>
                        <span>{tx.quantity}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Discount</span>
                        <span className="text-destructive">-{formatCurrency(tx.discount)}</span>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
