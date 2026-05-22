import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { AdminLayout } from "../../components/AdminLayout";
import { api, AdminLineCharts, formatCurrency } from "../../lib/api";

const months = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

export default function Revenue() {
  const [charts, setCharts] = useState<AdminLineCharts | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.getLineCharts()
      .then(res => {
        setCharts(res.charts);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  if (isLoading) return <AdminLayout><div>Loading revenue data...</div></AdminLayout>;
  if (!charts) return <AdminLayout><div>No revenue data available.</div></AdminLayout>;

  // Prepare data for the 12 month chart
  const annualData = charts.revenue.map((val, i) => {
     const monthIndex = (new Date().getMonth() - (11 - i) + 12) % 12;
     return {
        name: months[monthIndex],
        revenue: val,
        discount: charts.discount[i],
        users: charts.users[i]
     };
  });

  const totals = {
     revenue: charts.revenue.reduce((a, b) => a + b, 0),
     discount: charts.discount.reduce((a, b) => a + b, 0),
     users: charts.users.reduce((a, b) => a + b, 0)
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Revenue Analytics</h2>
          <p className="text-muted-foreground">Detailed financial trends from the last 12 months.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
           <Card className="border-0 shadow-md bg-primary text-primary-foreground">
              <CardContent className="p-6">
                 <p className="text-primary-foreground/70 text-sm font-medium">Total Annual Revenue</p>
                 <h3 className="text-3xl font-bold mt-1">{formatCurrency(totals.revenue)}</h3>
              </CardContent>
           </Card>
           <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                 <p className="text-muted-foreground text-sm font-medium">Total Discounts Allowed</p>
                 <h3 className="text-3xl font-bold mt-1 text-destructive">{formatCurrency(totals.discount)}</h3>
              </CardContent>
           </Card>
           <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                 <p className="text-muted-foreground text-sm font-medium">Total Active Users (12m)</p>
                 <h3 className="text-3xl font-bold mt-1 text-blue-500">{totals.users}</h3>
              </CardContent>
           </Card>
        </div>

        <div className="grid gap-8">
          {/* Revenue & Discount Line Chart */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Revenue & Discounts Trend (Last 12 Months)</CardTitle>
            </CardHeader>
            <CardContent className="h-[450px] pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={annualData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                  />
                  <Legend iconType="circle" />
                  <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: "#3b82f6" }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="discount" name="Discount" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4, fill: "#f43f5e" }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Active Users Line Chart */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Active Users Trend</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px] pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={annualData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                  />
                  <Line type="stepAfter" dataKey="users" name="Active Users" stroke="#10b981" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
