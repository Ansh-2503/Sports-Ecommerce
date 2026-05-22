import React, { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Loader2, Ticket, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "react-toastify";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Textarea } from "../../components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import { AdminLayout } from "../../components/AdminLayout";
import { api, Coupon, formatCurrency } from "../../lib/api";
import { useApp } from "../../context/AppContext";

export default function Coupons() {
  const { user } = useApp();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(coupons.length / itemsPerPage);
  
  // Adjust current page if coupons size decreases
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [coupons.length, totalPages, currentPage]);

  const displayedCoupons = coupons.slice(
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

  // Form states
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [maxDiscountAmount, setMaxDiscountAmount] = useState("");
  const [minimumOrderAmount, setMinimumOrderAmount] = useState("0");
  const [applicableCategories, setApplicableCategories] = useState("");
  const [applicableProducts, setApplicableProducts] = useState("");
  const [usageLimit, setUsageLimit] = useState("1000");
  const [expiryDate, setExpiryDate] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    fetchCoupons();
  }, [user]);

  const fetchCoupons = async () => {
    if (!user?._id) return;
    setIsLoading(true);
    try {
      const res = await api.getAllCoupons(user._id);
      setCoupons(res.coupons);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch coupons");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setCode("");
    setTitle("");
    setDescription("");
    setDiscountType("percentage");
    setDiscountValue("");
    setMaxDiscountAmount("");
    setMinimumOrderAmount("0");
    setApplicableCategories("");
    setApplicableProducts("");
    setUsageLimit("1000");
    setExpiryDate("");
    setIsActive(true);
    setEditingCoupon(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (coupon: Coupon) => {
    resetForm();
    setEditingCoupon(coupon);
    setCode(coupon.code);
    setTitle(coupon.title);
    setDescription(coupon.description);
    setDiscountType(coupon.discountType);
    setDiscountValue(String(coupon.discountValue));
    setMaxDiscountAmount(coupon.maxDiscountAmount ? String(coupon.maxDiscountAmount) : "");
    setMinimumOrderAmount(String(coupon.minimumOrderAmount));
    setApplicableCategories(coupon.applicableCategories.join(", "));
    setApplicableProducts(coupon.applicableProducts ? coupon.applicableProducts.join(", ") : "");
    setUsageLimit(String(coupon.usageLimit));
    setExpiryDate(new Date(coupon.expiryDate).toISOString().split('T')[0]);
    setIsActive(coupon.isActive);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsActionLoading(true);

    try {
      const payload: Partial<Coupon> = {
        code,
        title,
        description,
        discountType,
        discountValue: Number(discountValue),
        maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : null,
        minimumOrderAmount: Number(minimumOrderAmount),
        applicableCategories: applicableCategories.split(",").map(c => c.trim()).filter(Boolean),
        applicableProducts: applicableProducts.split(",").map(c => c.trim()).filter(Boolean),
        usageLimit: Number(usageLimit),
        expiryDate: new Date(expiryDate).toISOString(),
        isActive,
      };

      if (editingCoupon) {
        await api.updateCoupon(editingCoupon._id, payload);
        toast.success("Coupon updated successfully");
      } else {
        await api.createCoupon(payload);
        toast.success("Coupon created successfully");
      }

      setIsDialogOpen(false);
      fetchCoupons();
    } catch (err: any) {
      toast.error(err.message || "Action failed");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this coupon?")) return;
    
    setIsActionLoading(true);
    try {
      await api.deleteCoupon(id);
      toast.success("Coupon deleted successfully");
      fetchCoupons();
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    } finally {
      setIsActionLoading(false);
    }
  };

  const toggleActive = async (coupon: Coupon) => {
    setIsActionLoading(true);
    try {
      await api.updateCoupon(coupon._id, { isActive: !coupon.isActive });
      toast.success(`Coupon ${!coupon.isActive ? 'activated' : 'deactivated'}`);
      fetchCoupons();
    } catch (err: any) {
      toast.error(err.message || "Action failed");
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Coupons</h2>
            <p className="text-muted-foreground">Manage your discount codes and promotions.</p>
          </div>
          <Button onClick={handleOpenCreate} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Coupon
          </Button>
        </div>

        <Card className="border-0 shadow-md">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Min. Order</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : coupons.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      No coupons found.
                    </TableCell>
                  </TableRow>
                ) : (
                  displayedCoupons.map((coupon) => (
                    <TableRow key={coupon._id}>
                      <TableCell>
                        <div className="font-bold flex items-center gap-2">
                          <Ticket className="h-4 w-4 text-primary" />
                          {coupon.code}
                        </div>
                        <div className="text-xs text-muted-foreground">{coupon.title}</div>
                      </TableCell>
                      <TableCell>
                        {coupon.discountType === "percentage" 
                          ? `${coupon.discountValue}% OFF` 
                          : formatCurrency(coupon.discountValue)}
                        {coupon.maxDiscountAmount && coupon.discountType === "percentage" && (
                          <div className="text-xs text-muted-foreground">Up to {formatCurrency(coupon.maxDiscountAmount)}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="text-sm">{coupon.usedCount} / {coupon.usageLimit}</div>
                          <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-primary h-full" 
                              style={{ width: `${Math.min(100, (coupon.usedCount / coupon.usageLimit) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(coupon.minimumOrderAmount)}</TableCell>
                      <TableCell>{new Date(coupon.expiryDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button 
                          variant={coupon.isActive ? "default" : "secondary"} 
                          size="sm" 
                          className="h-7 text-xs"
                          onClick={() => toggleActive(coupon)}
                        >
                          {coupon.isActive ? "Active" : "Inactive"}
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEdit(coupon)}
                            className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(coupon._id)}
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
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

            {/* Premium, Responsive Pagination Controls */}
            {coupons.length > itemsPerPage && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t bg-card rounded-b-xl shadow-sm">
                <div className="text-sm text-muted-foreground font-medium order-2 sm:order-1 text-center sm:text-left">
                  Showing <span className="font-semibold text-foreground">{((currentPage - 1) * itemsPerPage) + 1}</span> to{" "}
                  <span className="font-semibold text-foreground">{Math.min(currentPage * itemsPerPage, coupons.length)}</span> of{" "}
                  <span className="font-semibold text-foreground">{coupons.length}</span> coupons
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

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingCoupon ? "Edit Coupon" : "Add New Coupon"}</DialogTitle>
                <DialogDescription>
                  Set up your discount rules.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="code">Coupon Code</Label>
                    <Input id="code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} required placeholder="e.g. SUMMER50" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="title">Title</Label>
                    <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Summer Sale" />
                  </div>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} required placeholder="Get 50% off on all summer gear." />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="discountType">Discount Type</Label>
                    <select 
                      id="discountType"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={discountType} 
                      onChange={(e) => setDiscountType(e.target.value as any)}
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (₹)</option>
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="discountValue">Discount Value</Label>
                    <Input id="discountValue" type="number" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} required min="1" max={discountType === 'percentage' ? 50 : undefined} />
                  </div>
                </div>

                {discountType === 'percentage' && (
                  <div className="grid gap-2">
                    <Label htmlFor="maxDiscountAmount">Max Discount Amount (₹) - Optional</Label>
                    <Input id="maxDiscountAmount" type="number" value={maxDiscountAmount} onChange={(e) => setMaxDiscountAmount(e.target.value)} min="1" />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="minimumOrderAmount">Min Order Amount (₹)</Label>
                    <Input id="minimumOrderAmount" type="number" value={minimumOrderAmount} onChange={(e) => setMinimumOrderAmount(e.target.value)} required min="0" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="usageLimit">Total Usage Limit</Label>
                    <Input id="usageLimit" type="number" value={usageLimit} onChange={(e) => setUsageLimit(e.target.value)} required min="1" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="applicableCategories">Applicable Categories (comma separated)</Label>
                    <Input id="applicableCategories" value={applicableCategories} onChange={(e) => setApplicableCategories(e.target.value)} placeholder="e.g. shoes, clothing (leave empty for all)" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="applicableProducts">Applicable Product IDs (comma separated)</Label>
                    <Input id="applicableProducts" value={applicableProducts} onChange={(e) => setApplicableProducts(e.target.value)} placeholder="e.g. 64a... (leave empty for all)" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="expiryDate">Expiry Date</Label>
                    <Input id="expiryDate" type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} required />
                  </div>
                  <div className="grid gap-2 items-center mt-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4" />
                      <span className="text-sm font-medium">Coupon is Active</span>
                    </label>
                  </div>
                </div>

              </div>
              <DialogFooter>
                <Button type="submit" disabled={isActionLoading}>
                  {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingCoupon ? "Update Coupon" : "Create Coupon"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
