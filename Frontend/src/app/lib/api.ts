export type UserRole = "admin" | "user";

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  photo: string;
  role: UserRole;
  gender?: string;
  dob?: string;
}

export interface ApiProduct {
  _id: string;
  name: string;
  photo: string;
  price: number;
  stock: number;
  category: string;
  createdAt?: string;
}

export interface CategorySummary {
  name: string;
  itemCount: number;
}

export interface ShippingInfo {
  address: string;
  city: string;
  state: string;
  country: string;
  pinCode: number;
}

export interface ShippingAddress extends ShippingInfo {
  _id: string;
  user: string;
  createdAt: string;
  updatedAt: string;
}

export interface WishlistItem {
  product: ApiProduct;
  addedAt: string;
}

export interface Wishlist {
  _id: string;
  name: string;
  user: string;
  items: WishlistItem[];
  createdAt: string;
}

export interface OrderItem {
  name: string;
  photo: string;
  price: number;
  quantity: number;
  productId: string;
}

export interface Order {
  _id: string;
  shippingInfo: ShippingInfo;
  user: string | { _id: string; name: string };
  subtotal: number;
  tax: number;
  shippingCharges: number;
  discount: number;
  total: number;
  status: "Processing" | "Shipped" | "Delivered";
  orderItems: OrderItem[];
  createdAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  gender: string;
  dob: string;
  photo?: string;
}

export interface Coupon {
  _id: string;
  code: string;
  title: string;
  description: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  maxDiscountAmount: number | null;
  minimumOrderAmount: number;
  applicableCategories: string[];
  applicableProducts: string[];
  usageLimit: number;
  usedCount: number;
  expiryDate: string;
  isActive: boolean;
  savings?: number; // Only present when fetched via eligible
}

export interface AdminDashboardStats {
  categoryCount: Record<string, number>[];
  changePercent: {
    revenue: number;
    product: number;
    user: number;
    order: number;
  };
  count: {
    revenue: number;
    product: number;
    user: number;
    order: number;
  };
  chart: {
    order: number[];
    revenue: number[];
  };
  userRatio: {
    male: number;
    female: number;
  };
  latestTransaction: Array<{
    _id: string;
    discount: number;
    amount: number;
    quantity: number;
    status: Order["status"];
  }>;
}

export interface AdminPieCharts {
  orderFullfillment: {
    processing: number;
    shipped: number;
    delivered: number;
  };
  productCategories: Record<string, number>[];
  stockAvailablity: {
    inStock: number;
    outOfStock: number;
  };
  revenueDistribution: {
    netMargin: number;
    discount: number;
    productionCost: number;
    burnt: number;
    marketingCost: number;
  };
  usersAgeGroup: {
    teen: number;
    adult: number;
    old: number;
  };
  adminCustomer: {
    admin: number;
    customer: number;
  };
}

export interface AdminBarCharts {
  users: number[];
  products: number[];
  orders: number[];
}

export interface AdminLineCharts {
  users: number[];
  products: number[];
  discount: number[];
  revenue: number[];
}

interface ProductListResponse {
  products: ApiProduct[];
  totalPage: number;
  totalProducts: number;
}

const rawBaseUrl = import.meta.env.VITE_SERVER || "http://localhost:4000/api/v1";

export const API_BASE_URL = rawBaseUrl.endsWith("/api/v1")
  ? rawBaseUrl
  : `${rawBaseUrl.replace(/\/$/, "")}/api/v1`;

const serverRoot = API_BASE_URL.replace(/\/api\/v1$/, "");

let refreshingPromise: Promise<string> | null = null;

async function performRefresh(): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });
  const data = await response.json().catch(() => ({}));
  if (data.success && data.accessToken) {
    localStorage.setItem("sportequip-access-token", data.accessToken);
    return data.accessToken;
  }
  localStorage.removeItem("sportequip-access-token");
  throw new Error("Session expired. Please log in again.");
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const getHeaders = (token: string | null) => {
    const h: Record<string, string> = {};
    // Only set Content-Type if not sending FormData (browser sets boundary automatically)
    if (!(init?.body instanceof FormData)) {
      h["Content-Type"] = "application/json";
    }
    if (token) {
      h["Authorization"] = `Bearer ${token}`;
    }
    return { ...h, ...init?.headers };
  };

  const token = localStorage.getItem("sportequip-access-token");

  let response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: getHeaders(token),
    credentials: "include",
  });

  // If 401 and not an auth route, try to refresh token
  if (
    response.status === 401 &&
    !path.includes("/auth/login") &&
    !path.includes("/auth/refresh")
  ) {
    try {
      if (!refreshingPromise) {
        refreshingPromise = performRefresh().finally(() => {
          refreshingPromise = null;
        });
      }
      const newToken = await refreshingPromise;

      // Retry original request with new token
      response = await fetch(`${API_BASE_URL}${path}`, {
        ...init,
        headers: getHeaders(newToken),
        credentials: "include",
      });
    } catch (refreshError) {
      // Refresh failed, let the error propagate
      throw refreshError;
    }
  }

  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || "Something went wrong");
  }

  return payload as T;
}

export function getAssetUrl(path?: string, defaultName?: string) {
  if (!path) {
    const nameStr = defaultName ? encodeURIComponent(defaultName) : "User";
    return `https://ui-avatars.com/api/?name=${nameStr}&background=random`;
  }
  if (/^https?:\/\//i.test(path)) return path;
  return `${serverRoot}/${path.replace(/\\/g, "/").replace(/^\/+/, "")}`;
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export const api = {
  // --- Auth & User ---
  async login(credentials: LoginCredentials) {
    return request<{ accessToken: string; user: UserProfile }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  },

  async register(userData: RegisterPayload) {
    return request<{ accessToken: string; user: UserProfile }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  },

  async logout() {
    return request<{ message: string }>("/auth/logout", {
      method: "POST",
    });
  },

  async getMe() {
    return request<{ user: UserProfile }>("/auth/me");
  },

  async getUser(id: string) {
    return request<{ user: UserProfile }>(`/user/${id}`);
  },

  async getAllUsers() {
    return request<{ users: UserProfile[] }>("/user/all");
  },

  async deleteUser(id: string) {
    return request<{ message: string }>(`/user/${id}`, {
      method: "DELETE",
    });
  },

  async updateProfile(id: string, formData: FormData) {
    return request<{ message: string; user: UserProfile }>(`/user/${id}`, {
      method: "PATCH",
      body: formData,
    });
  },

  // --- Products & Categories ---
  async getProducts(params: {
    search?: string;
    category?: string;
    sort?: "asc" | "dsc";
    page?: number;
    price?: number;
    minPrice?: number;
  }) {
    const query = new URLSearchParams();
    if (params.search) query.set("search", params.search);
    if (params.category && params.category !== "all")
      query.set("category", params.category);
    if (params.sort) query.set("sort", params.sort);
    if (params.page) query.set("page", String(params.page));
    if (params.price) query.set("price", String(params.price));
    if (params.minPrice) query.set("minPrice", String(params.minPrice));

    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<ProductListResponse>(`/product/all${suffix}`);
  },

  async getAdminProducts() {
    return request<{ products: ApiProduct[] }>("/product/admin-products");
  },

  async createProduct(formData: FormData) {
    return request<{ message: string }>("/product/new", {
      method: "POST",
      body: formData,
    });
  },

  async updateProduct(id: string, formData: FormData) {
    return request<{ message: string }>(`/product/${id}`, {
      method: "PUT",
      body: formData,
    });
  },

  async deleteProduct(id: string) {
    return request<{ message: string }>(`/product/${id}`, {
      method: "DELETE",
    });
  },

  async getCategories() {
    return request<{
      categories: string[];
      categoryDetails?: CategorySummary[];
    }>("/product/categories");
  },

  // --- Orders & Dashboard ---
  async getMyOrders() {
    return request<{ orders: Order[] }>(`/order/my`);
  },

  async getOrder(id: string) {
    return request<{ order: Order }>(`/order/${id}`);
  },

  async getAllOrders() {
    return request<{ orders: Order[] }>(`/order/all`);
  },

  async processOrder(id: string) {
    return request<{ message: string }>(`/order/${id}`, {
      method: "PUT",
    });
  },

  async deleteOrder(id: string) {
    return request<{ message: string }>(`/order/${id}`, {
      method: "DELETE",
    });
  },

  async getDashboardStats() {
    return request<{ stats: AdminDashboardStats }>(`/dashboard/stats`);
  },

  async getPieCharts() {
    return request<{ charts: AdminPieCharts }>("/dashboard/pie");
  },

  async getBarCharts() {
    return request<{ charts: AdminBarCharts }>("/dashboard/bar");
  },

  async getLineCharts() {
    return request<{ charts: AdminLineCharts }>("/dashboard/line");
  },

  async applyCoupon(code: string, totalPrice: number, category?: string) {
    const query = new URLSearchParams({
      coupon: code,
      totalPrice: String(totalPrice),
    });
    if (category) query.set("category", category);
    return request<{ discount: Coupon }>(`/payment/discount?${query.toString()}`);
  },

  async getEligibleCoupons(input: {
    subtotal: number;
    categories?: string[];
    products?: string[];
  }) {
    return request<{ coupons: Coupon[] }>("/payment/coupon/eligible", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async getAllCoupons(adminId?: string) {
    const query = new URLSearchParams();
    if (adminId) query.set("id", adminId);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<{ coupons: Coupon[] }>(`/payment/coupon/all${suffix}`);
  },

  async createCoupon(data: Partial<Coupon>) {
    return request<{ message: string }>("/payment/coupon/new", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateCoupon(id: string, data: Partial<Coupon>) {
    return request<{ message: string; coupon: Coupon }>(`/payment/coupon/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async deleteCoupon(id: string) {
    return request<{ message: string }>(`/payment/coupon/${id}`, {
      method: "DELETE",
    });
  },

  async createPaymentIntent(input: {
    orderItems: OrderItem[];
    couponCode?: string;
    shippingInfo: ShippingInfo;
    userName?: string;
    userEmail?: string;
    description?: string;
  }) {
    return request<{ clientSecret: string }>("/payment/create", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async createOrder(input: {
    shippingInfo: ShippingInfo;
    orderItems: OrderItem[];
    subtotal: number;
    tax: number;
    shippingCharges: number;
    discount: number;
    total: number;
    couponCode?: string;
  }) {
    return request<{ message: string }>("/order/new", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  // --- Shipping Address ---
  async getShippingAddress() {
    return request<{ shippingAddress: ShippingAddress | null }>("/shipping");
  },

  async saveShippingAddress(data: ShippingInfo) {
    return request<{ message: string; shippingAddress: ShippingAddress }>(
      "/shipping",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  },

  async deleteShippingAddress() {
    return request<{ message: string }>("/shipping", {
      method: "DELETE",
    });
  },

  // --- Wishlist ---
  async getWishlists() {
    return request<{ wishlists: Wishlist[] }>("/wishlist");
  },

  async createWishlist(name: string) {
    return request<{ message: string; wishlist: Wishlist }>("/wishlist", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
  },

  async updateWishlist(id: string, name: string) {
    return request<{ message: string; wishlist: Wishlist }>(`/wishlist/${id}`, {
      method: "PUT",
      body: JSON.stringify({ name }),
    });
  },

  async deleteWishlist(id: string) {
    return request<{ message: string }>(`/wishlist/${id}`, {
      method: "DELETE",
    });
  },

  async addToWishlist(id: string, productId: string) {
    return request<{ message: string; wishlist: Wishlist }>(`/wishlist/${id}/items`, {
      method: "POST",
      body: JSON.stringify({ productId }),
    });
  },

  async removeFromWishlist(id: string, productId: string) {
    return request<{ message: string; wishlist: Wishlist }>(`/wishlist/${id}/items/${productId}`, {
      method: "DELETE",
    });
  },
};

