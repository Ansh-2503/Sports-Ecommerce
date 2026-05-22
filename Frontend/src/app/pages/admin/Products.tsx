import React, { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Loader2, Upload, ImageIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "react-toastify";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
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
import { api, ApiProduct, formatCurrency, getAssetUrl } from "../../lib/api";

export default function Products() {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ApiProduct | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoPreview, setPhotoPreview] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(products.length / itemsPerPage);
  
  // Adjust current page if products size decreases
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [products.length, totalPages, currentPage]);

  const displayedProducts = products.slice(
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
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await api.getAdminProducts();
      setProducts(res.products);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch products");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setPrice("");
    setStock("");
    setCategory("");
    setPhoto(null);
    setPhotoUrl("");
    setPhotoPreview("");
    setEditingProduct(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (product: ApiProduct) => {
    resetForm();
    setEditingProduct(product);
    setName(product.name);
    setPrice(String(product.price));
    setStock(String(product.stock));
    setCategory(product.category);
    
    const url = getAssetUrl(product.photo);
    setPhotoPreview(url);
    if (product.photo.startsWith("http")) {
      setPhotoUrl(product.photo);
    }
    setIsDialogOpen(true);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      setPhotoUrl(""); // Clear URL if file is selected
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsActionLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("price", price);
      formData.append("stock", stock);
      formData.append("category", category);
      if (photo) formData.append("photo", photo);
      if (photoUrl) formData.append("photoUrl", photoUrl);

      if (editingProduct) {
        await api.updateProduct(editingProduct._id, formData);
        toast.success("Product updated successfully");
      } else {
        await api.createProduct(formData);
        toast.success("Product created successfully");
      }

      setIsDialogOpen(false);
      fetchProducts();
    } catch (err: any) {
      toast.error(err.message || "Action failed");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    
    setIsActionLoading(true);
    try {
      await api.deleteProduct(id);
      toast.success("Product deleted successfully");
      fetchProducts();
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Products</h2>
            <p className="text-muted-foreground">Manage your store inventory.</p>
          </div>
          <Button onClick={handleOpenCreate} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </div>

        <Card className="border-0 shadow-md">
          <CardContent className="p-0">
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Photo</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
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
                  ) : products.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        No products found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    displayedProducts.map((product) => (
                      <TableRow key={product._id}>
                        <TableCell>
                          <img
                            src={getAssetUrl(product.photo)}
                            alt={product.name}
                            className="h-10 w-10 rounded-md object-cover border"
                          />
                        </TableCell>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{product.category}</Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(product.price)}</TableCell>
                        <TableCell>
                          <span className={product.stock <= 5 ? "text-destructive font-bold" : ""}>
                            {product.stock}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenEdit(product)}
                              className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                               size="icon"
                              onClick={() => handleDelete(product._id)}
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
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden flex flex-col gap-4 p-4 sm:p-0">
              {isLoading ? (
                <div className="py-8 flex justify-center">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : products.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-sm">No products found.</div>
              ) : (
                displayedProducts.map((product) => (
                  <Card key={product._id} className="border shadow-sm overflow-hidden bg-background">
                    <div className="p-4 flex gap-4">
                      <img
                        src={getAssetUrl(product.photo)}
                        alt={product.name}
                        className="h-16 w-16 rounded-md object-cover border bg-muted"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <h4 className="font-medium truncate">{product.name}</h4>
                        </div>
                        <Badge variant="secondary" className="mb-2">{product.category}</Badge>
                        <div className="flex justify-between items-center text-sm mt-1">
                          <span className="font-bold text-primary">{formatCurrency(product.price)}</span>
                          <span className={product.stock <= 5 ? "text-destructive font-bold text-xs" : "text-muted-foreground text-xs"}>
                            Stock: {product.stock}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="p-2 bg-muted/30 border-t flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEdit(product)}
                        className="text-blue-500 border-blue-500/30 hover:bg-blue-50 gap-1.5"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(product._id)}
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
            {products.length > itemsPerPage && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t bg-card rounded-b-xl shadow-sm">
                <div className="text-sm text-muted-foreground font-medium order-2 sm:order-1 text-center sm:text-left">
                  Showing <span className="font-semibold text-foreground">{((currentPage - 1) * itemsPerPage) + 1}</span> to{" "}
                  <span className="font-semibold text-foreground">{Math.min(currentPage * itemsPerPage, products.length)}</span> of{" "}
                  <span className="font-semibold text-foreground">{products.length}</span> products
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
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
                <DialogDescription>
                  Enter the details of the product here. Click save when you're done.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="price">Price</Label>
                    <Input id="price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="stock">Stock</Label>
                    <Input id="stock" type="number" value={stock} onChange={(e) => setStock(e.target.value)} required />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Input id="category" value={category} onChange={(e) => setCategory(e.target.value)} required />
                </div>
                
                <div className="grid gap-2">
                  <Label>Photo</Label>
                  <div className="flex flex-col gap-4">
                    {photoPreview && (
                      <div className="relative w-20 h-20 rounded-md overflow-hidden border">
                         <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="grid grid-cols-1 gap-2">
                       <Label 
                         htmlFor="photo-file" 
                         className={`flex items-center gap-2 p-2 border rounded-md cursor-pointer hover:bg-secondary ${photoUrl ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
                       >
                          <Upload className="h-4 w-4" />
                          <span className="text-xs">{photo ? photo.name : "Upload Image File"}</span>
                       </Label>
                       <input 
                         id="photo-file" 
                         type="file" 
                         className="hidden" 
                         accept="image/*" 
                         onChange={handlePhotoChange} 
                         disabled={!!photoUrl}
                       />
                       
                       <div className="flex items-center gap-2">
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                          <Input 
                            placeholder="Or enter Image URL" 
                            value={photoUrl} 
                            onChange={(e) => {
                              const val = e.target.value;
                              setPhotoUrl(val);
                              setPhotoPreview(val);
                              if (val) setPhoto(null); // Clear file if URL is entered
                            }} 
                            disabled={!!photo}
                            className="h-8 text-xs"
                          />
                       </div>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isActionLoading}>
                  {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Product
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
