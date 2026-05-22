import React, { ReactNode } from "react";
import { Link, useLocation } from "react-router";
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  Receipt,
  BarChart3,
  PieChart,
  IndianRupee,
  Ticket,
  ChevronLeft,
  Menu,
} from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import { useApp } from "../context/AppContext";
import { MobileDrawer } from "./ui/MobileDrawer";

interface AdminLayoutProps {
  children: ReactNode;
}

const navItems = [
  { label: "Overview", icon: LayoutDashboard, path: "/admin/overview" },
  { label: "Products", icon: ShoppingBag, path: "/admin/products" },
  { label: "Customers", icon: Users, path: "/admin/customers" },
  { label: "Transactions", icon: Receipt, path: "/admin/transactions" },
  { label: "Coupons", icon: Ticket, path: "/admin/coupons" },
  { label: "Charts", icon: BarChart3, path: "/admin/charts" },
  { label: "Ratios", icon: PieChart, path: "/admin/ratios" },
  { label: "Revenue", icon: IndianRupee, path: "/admin/revenue" },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const { user } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card hidden md:flex flex-col sticky top-0 h-screen">
        <div className="p-6 border-b">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-primary-foreground font-bold">SE</span>
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Admin Panel
            </h1>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t">
          <Link to="/">
            <Button variant="outline" className="w-full flex items-center gap-2">
              <ChevronLeft className="h-4 w-4" />
              Back to Store
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden">
        <header className="h-16 border-b bg-card flex items-center justify-between px-4 md:px-8 md:hidden sticky top-0 z-40">
           <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-primary-foreground font-bold">SE</span>
            </div>
          </Link>
          <h1 className="font-bold">Admin Panel</h1>
          <button 
            className="p-2 -mr-2"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </header>

        <MobileDrawer 
          isOpen={isMobileMenuOpen} 
          onClose={() => setIsMobileMenuOpen(false)}
          title="Admin Menu"
        >
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t mt-auto">
            <Link to="/">
              <Button variant="outline" className="w-full flex items-center gap-2">
                <ChevronLeft className="h-4 w-4" />
                Back to Store
              </Button>
            </Link>
          </div>
        </MobileDrawer>

        <div className="p-4 md:p-8">
           {children}
        </div>
      </main>
    </div>
  );
}
