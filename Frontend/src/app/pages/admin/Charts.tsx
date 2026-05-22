import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { AdminLayout } from "../../components/AdminLayout";
import { api, AdminBarCharts } from "../../lib/api";
import { ChartSkeleton, ErrorState } from "../../components/feedback/PageState";

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function Charts() {
  const [charts, setCharts] = useState<AdminBarCharts | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Single, clean fetch — no duplicate call, correct loading state management
    api.getBarCharts()
      .then((res) => {
        setCharts(res.charts);
      })
      .catch((err: any) => {
        setError(err.message || "Failed to load chart data.");
      })
      .finally(() => {
        setIsLoading(false); // Always stop loading, success or failure
      });
  }, []);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Analytics Charts</h2>
            <p className="text-muted-foreground">Annual growth and activity overview.</p>
          </div>
          <ChartSkeleton rows={2} />
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Analytics Charts</h2>
            <p className="text-muted-foreground">Annual growth and activity overview.</p>
          </div>
          <ErrorState
            title="Failed to load charts"
            message={error}
            onRetry={() => {
              setError("");
              setIsLoading(true);
              api.getBarCharts()
                .then((res) => setCharts(res.charts))
                .catch((err: any) => setError(err.message || "Failed to load chart data."))
                .finally(() => setIsLoading(false));
            }}
          />
        </div>
      </AdminLayout>
    );
  }

  if (!charts) return null;

  // Prepare data for User & Products (Last 6 Months)
  const userProductData = charts.users.map((val, i) => ({
    name: months[(new Date().getMonth() - (5 - i) + 12) % 12],
    users: val,
    products: charts.products[i]
  }));

  // Prepare data for Orders (Last 12 Months)
  const orderData = charts.orders.map((val, i) => ({
    name: months[(new Date().getMonth() - (11 - i) + 12) % 12],
    orders: val
  }));

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics Charts</h2>
          <p className="text-muted-foreground">Annual growth and activity overview.</p>
        </div>

        <div className="grid gap-8">
          {/* Users & Products Bar Chart */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Top Activity (Users & Products — Last 6 Months)</CardTitle>
            </CardHeader>
            <CardContent className="h-[400px] pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={userProductData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                    contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                  />
                  <Legend iconType="circle" />
                  <Bar dataKey="users" name="New Users" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
                  <Bar dataKey="products" name="New Products" fill="#fbbf24" radius={[4, 4, 0, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Orders Throughout the Year */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Orders throughout the year</CardTitle>
            </CardHeader>
            <CardContent className="h-[400px] pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={orderData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                    contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                  />
                  <Bar dataKey="orders" name="Orders" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
