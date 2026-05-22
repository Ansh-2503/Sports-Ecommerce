import React, { useEffect, useState } from "react";
import { Trash2, Loader2, Mail, User as UserIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "react-toastify";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { AdminLayout } from "../../components/AdminLayout";
import { api, UserProfile, getAssetUrl } from "../../lib/api";

export default function Customers() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(users.length / itemsPerPage);
  
  // Adjust current page if users size decreases
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [users.length, totalPages, currentPage]);

  const displayedUsers = users.slice(
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
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await api.getAllUsers();
      setUsers(res.users);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch users");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
    
    setIsDeleting(id);
    try {
      await api.deleteUser(id);
      toast.success("User deleted successfully");
      setUsers(prev => prev.filter(u => u._id !== id));
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Customers</h2>
          <p className="text-muted-foreground">Manage your registered users.</p>
        </div>

        <Card className="border-0 shadow-md">
          <CardContent className="p-0">
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Avatar</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Role</TableHead>
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
                  ) : users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        No users found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    displayedUsers.map((user) => (
                      <TableRow key={user._id}>
                        <TableCell>
                          <Avatar className="h-10 w-10 border">
                            <AvatarImage src={getAssetUrl(user.photo, user.name)} alt={user.name} />
                            <AvatarFallback><UserIcon /></AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-muted-foreground">
                             <Mail className="h-3 w-3" />
                             <span className="text-sm">{user.email}</span>
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">{user.gender || "—"}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={user.role === "admin" ? "default" : "secondary"}
                            className={user.role === "admin" ? "bg-primary" : ""}
                          >
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(user._id)}
                            disabled={isDeleting === user._id || user.role === "admin"}
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            title={user.role === "admin" ? "Cannot delete admin" : "Delete user"}
                          >
                            {isDeleting === user._id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
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
              ) : users.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-sm">No users found.</div>
              ) : (
                displayedUsers.map((user) => (
                  <Card key={user._id} className="border shadow-sm overflow-hidden bg-background">
                    <div className="p-4 flex gap-4 items-center">
                      <Avatar className="h-12 w-12 border">
                        <AvatarImage src={getAssetUrl(user.photo, user.name)} alt={user.name} />
                        <AvatarFallback><UserIcon /></AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{user.name}</h4>
                        <div className="flex items-center gap-1.5 text-muted-foreground mt-0.5">
                           <Mail className="h-3 w-3 flex-shrink-0" />
                           <span className="text-xs truncate">{user.email}</span>
                        </div>
                      </div>
                      <Badge 
                        variant={user.role === "admin" ? "default" : "secondary"}
                        className={user.role === "admin" ? "bg-primary" : ""}
                      >
                        {user.role}
                      </Badge>
                    </div>
                    <div className="p-3 bg-muted/30 border-t flex justify-between items-center">
                      <span className="text-sm text-muted-foreground capitalize">
                        Gender: {user.gender || "—"}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(user._id)}
                        disabled={isDeleting === user._id || user.role === "admin"}
                        className="text-destructive border-destructive/30 hover:bg-destructive/10 gap-1.5"
                      >
                        {isDeleting === user._id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                        Delete
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>

            {/* Premium, Responsive Pagination Controls */}
            {users.length > itemsPerPage && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t bg-card rounded-b-xl shadow-sm">
                <div className="text-sm text-muted-foreground font-medium order-2 sm:order-1 text-center sm:text-left">
                  Showing <span className="font-semibold text-foreground">{((currentPage - 1) * itemsPerPage) + 1}</span> to{" "}
                  <span className="font-semibold text-foreground">{Math.min(currentPage * itemsPerPage, users.length)}</span> of{" "}
                  <span className="font-semibold text-foreground">{users.length}</span> customers
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
