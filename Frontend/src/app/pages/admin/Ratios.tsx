import React, { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { AdminLayout } from "../../components/AdminLayout";
import { api, AdminPieCharts } from "../../lib/api";

const COLORS = ["#3b82f6", "#10b981", "#fbbf24", "#f43f5e", "#8b5cf6", "#06b6d4"];

export default function Ratios() {
  const [charts, setCharts] = useState<AdminPieCharts | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.getPieCharts()
      .then(res => {
        setCharts(res.charts);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  if (isLoading) return <AdminLayout><div>Loading ratios...</div></AdminLayout>;
  if (!charts) return <AdminLayout><div>No ratio data available.</div></AdminLayout>;

  // Prepare data for fulfillment
  const fulfillmentData = Object.entries(charts.orderFullfillment).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  }));

  // Prepare data for categories
  const categoryData = charts.productCategories.map(cat => {
    const [name, value] = Object.entries(cat)[0];
    return { name, value };
  });

  // Prepare data for stock
  const stockData = [
    { name: "In Stock", value: charts.stockAvailablity.inStock },
    { name: "Out of Stock", value: charts.stockAvailablity.outOfStock }
  ];

  // Prepare data for revenue distribution
  const revenueData = Object.entries(charts.revenueDistribution).map(([name, value]) => ({
    name: name.replace(/([A-Z])/g, ' $1').charAt(0).toUpperCase() + name.replace(/([A-Z])/g, ' $1').slice(1),
    value
  }));

  // Prepare data for age group
  const ageData = [
    { name: "Teen (<20)", value: charts.usersAgeGroup.teen },
    { name: "Adult (20-40)", value: charts.usersAgeGroup.adult },
    { name: "Older (>40)", value: charts.usersAgeGroup.old }
  ];

  // Prepare data for role
  const roleData = [
    { name: "Admin", value: charts.adminCustomer.admin },
    { name: "Customer", value: charts.adminCustomer.customer }
  ];

  const PieCard = ({ title, data }: { title: string, data: any[] }) => (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle className="text-center">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
               contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
            />
            <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Ratio Analytics</h2>
          <p className="text-muted-foreground">Distribution and fulfillment insights.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <PieCard title="Order Fulfillment" data={fulfillmentData} />
          <PieCard title="Product Categories" data={categoryData} />
          <PieCard title="Stock Availability" data={stockData} />
          <PieCard title="Revenue Distribution" data={revenueData} />
          <PieCard title="Users Age Group" data={ageData} />
          <PieCard title="Admin & Customer Ratio" data={roleData} />
        </div>
      </div>
    </AdminLayout>
  );
}
