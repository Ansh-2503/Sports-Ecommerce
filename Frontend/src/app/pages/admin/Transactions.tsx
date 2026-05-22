import React, { useEffect, useState } from "react";
import { Receipt, Loader2, Trash2, CheckCircle, Truck, Package, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "react-toastify";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
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
import { api, Order, formatCurrency } from "../../lib/api";

export default function Transactions() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(orders.length / itemsPerPage);
  
  // Adjust current page if orders size decreases
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [orders.length, totalPages, currentPage]);

  const displayedOrders = orders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const res = await api.getAllOrders();
      setOrders(res.orders);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch orders");
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcess = async (id: string) => {
    setIsActionLoading(id);
    try {
      const res = await api.processOrder(id);
      toast.success(res.message);
      fetchOrders();
    } catch (err: any) {
      toast.error(err.message || "Process failed");
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this transaction record?")) return;
    
    setIsActionLoading(id);
    try {
      const res = await api.deleteOrder(id);
      toast.success(res.message);
      setOrders(prev => prev.filter(o => o._id !== id));
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    } finally {
      setIsActionLoading(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Processing": return <Package className="h-3 w-3" />;
      case "Shipped": return <Truck className="h-3 w-3" />;
      case "Delivered": return <CheckCircle className="h-3 w-3" />;
      default: return null;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "Delivered": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "Shipped": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      default: return "bg-orange-500/10 text-orange-500 border-orange-500/20";
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Transactions</h2>
          <p className="text-muted-foreground">Manage order fulfillment and sales history.</p>
        </div>

        <Card className="border-0 shadow-md">
          <CardContent className="p-0">
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : orders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        No transactions found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    displayedOrders.map((order) => (
                      <TableRow key={order._id}>
                        <TableCell className="font-mono text-xs uppercase font-medium">
                           #{order._id.slice(-8)}
                        </TableCell>
                        <TableCell>
                           {typeof order.user === "object" ? order.user.name : "Unknown User"}
                        </TableCell>
                        <TableCell>
                           <div className="flex flex-col">
                              <span className="font-medium">{order.orderItems.length} items</span>
                              <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">
                                 {order.orderItems.map(i => i.name).join(", ")}
                              </span>
                           </div>
                        </TableCell>
                        <TableCell className="font-bold">
                           {formatCurrency(order.total)}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline"
                            className={`flex items-center w-fit gap-1.5 ${getStatusClass(order.status)}`}
                          >
                            {getStatusIcon(order.status)}
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                             {order.status !== "Delivered" && (
                                <Button
                                  size="sm"
                                  onClick={() => handleProcess(order._id)}
                                  disabled={isActionLoading === order._id}
                                  className="h-8 px-3"
                                >
                                   {isActionLoading === order._id ? (
                                       <Loader2 className="h-3 w-3 animate-spin" />
                                   ) : (
                                       order.status === "Processing" ? "Ship" : "Deliver"
                                   )}
                                </Button>
                             )}
                             <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(order._id)}
                                disabled={isActionLoading === order._id}
                                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                             >
                                <Trash2 className="h-4 w-4" />
                             </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden flex flex-col gap-4 p-4 sm:p-0">
              {isLoading ? (
                <div className="py-8 flex justify-center">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : orders.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-sm">No transactions found.</div>
              ) : (
                displayedOrders.map((order) => (
                  <Card key={order._id} className="border shadow-sm overflow-hidden bg-background">
                    <div className="p-3 border-b bg-muted/30 flex justify-between items-center">
                      <span className="font-medium font-mono text-xs uppercase">#{order._id.slice(-8)}</span>
                      <Badge 
                        variant="outline"
                        className={`flex items-center gap-1.5 ${getStatusClass(order.status)}`}
                      >
                        {getStatusIcon(order.status)}
                        {order.status}
                      </Badge>
                    </div>
                    <div className="p-4 space-y-3">
                      <div>
                        <p className="text-sm font-medium">
                          {typeof order.user === "object" ? order.user.name : "Unknown User"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate max-w-full mt-0.5">
                          {order.orderItems.length} items • {order.orderItems.map(i => i.name).join(", ")}
                        </p>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Total</span>
                        <span className="font-bold text-primary text-base">{formatCurrency(order.total)}</span>
                      </div>
                    </div>
                    <div className="p-3 bg-muted/30 border-t flex justify-end gap-2">
                       {order.status !== "Delivered" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleProcess(order._id)}
                            disabled={isActionLoading === order._id}
                            className="gap-1.5"
                          >
                             {isActionLoading === order._id ? (
                                 <Loader2 className="h-3.5 w-3.5 animate-spin" />
                             ) : (
                                 order.status === "Processing" ? "Mark Shipped" : "Mark Delivered"
                             )}
                          </Button>
                       )}
                       <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(order._id)}
                          disabled={isActionLoading === order._id}
                          className="text-destructive border-destructive/30 hover:bg-destructive/10 gap-1.5"
                       >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                       </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>

            {/* Premium, Responsive Pagination Controls */}
            {orders.length > itemsPerPage && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t bg-card rounded-b-xl shadow-sm">
                <div className="text-sm text-muted-foreground font-medium order-2 sm:order-1 text-center sm:text-left">
                  Showing <span className="font-semibold text-foreground">{((currentPage - 1) * itemsPerPage) + 1}</span> to{" "}
                  <span className="font-semibold text-foreground">{Math.min(currentPage * itemsPerPage, orders.length)}</span> of{" "}
                  <span className="font-semibold text-foreground">{orders.length}</span> transactions
                </div>
                <div className="flex items-center justify-center gap-1.5 order-1 sm:order-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="h-9 w-9 rounded-lg hover:bg-secondary transition-all hover:scale-105 active:scale-95 shadow-sm disabled:opacity-50"
                    title="Previous Page"
                    aria-label="Previous Page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  {/* Page Numbers */}
                  {getPageNumbers().map((page, index) => {
                    if (page === '...') {
                      return (
                        <span key={`dots-${index}`} className="px-2 text-muted-foreground font-semibold text-sm">
                          ...
                        </span>
                      );
                    }
                    return (
                      <Button
                        key={`page-${page}`}
                        variant={currentPage === page ? "default" : "outline"}
                        onClick={() => setCurrentPage(page as number)}
                        className={`h-9 w-9 rounded-lg text-xs font-bold transition-all hover:scale-105 active:scale-95 ${
                          currentPage === page 
                            ? "shadow-md bg-gradient-to-r from-primary to-accent text-primary-foreground border-0 hover:opacity-90 animate-none" 
                            : "hover:bg-secondary border-muted-foreground/10"
                        }`}
                      >
                        {page}
                      </Button>
                    );
                  })}

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="h-9 w-9 rounded-lg hover:bg-secondary transition-all hover:scale-105 active:scale-95 shadow-sm disabled:opacity-50"
                    title="Next Page"
                    aria-label="Next Page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
