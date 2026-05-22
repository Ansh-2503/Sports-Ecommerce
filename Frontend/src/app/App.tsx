import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Auth } from './components/Auth';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PageLoader } from './components/feedback/PageState';
import { ScrollToTop } from './components/ScrollToTop';

const HomePage = lazy(() => import('./pages/HomePage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const OrderDetailsPage = lazy(() => import('./pages/OrderDetailsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const WishlistsPage = lazy(() => import('./pages/WishlistsPage'));

const AdminOverview = lazy(() => import('./pages/admin/Overview'));
const AdminProducts = lazy(() => import('./pages/admin/Products'));
const AdminCustomers = lazy(() => import('./pages/admin/Customers'));
const AdminTransactions = lazy(() => import('./pages/admin/Transactions'));
const AdminCoupons = lazy(() => import('./pages/admin/Coupons'));
const AdminCharts = lazy(() => import('./pages/admin/Charts'));
const AdminRatios = lazy(() => import('./pages/admin/Ratios'));
const AdminRevenue = lazy(() => import('./pages/admin/Revenue'));

function AppShell() {
  const { isDark, setUser, isAuthModalOpen, setIsAuthModalOpen, isNewUser, setIsNewUser, setShippingAddress } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  const isAdminRoute = location.pathname.startsWith('/admin');

  useEffect(() => {
    if (isNewUser) {
      navigate('/profile', { replace: true });
    }
  }, [isNewUser, navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-background transition-colors duration-300">
      <ScrollToTop />

      {!isAdminRoute && <Header />}

      <Suspense fallback={<PageLoader className="flex-1 py-16" label="Loading page…" />}>
        <Routes>

          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />

          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <OrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/:id"
            element={
              <ProtectedRoute>
                <OrderDetailsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cart"
            element={
              <ProtectedRoute>
                <CartPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wishlists"
            element={
              <ProtectedRoute>
                <WishlistsPage />
              </ProtectedRoute>
            }
          />

          <Route path="/admin">
            <Route index element={<Navigate to="/admin/overview" replace />} />
            <Route path="overview" element={<ProtectedRoute adminOnly><AdminOverview /></ProtectedRoute>} />
            <Route path="products" element={<ProtectedRoute adminOnly><AdminProducts /></ProtectedRoute>} />
            <Route path="customers" element={<ProtectedRoute adminOnly><AdminCustomers /></ProtectedRoute>} />
            <Route path="transactions" element={<ProtectedRoute adminOnly><AdminTransactions /></ProtectedRoute>} />
            <Route path="coupons" element={<ProtectedRoute adminOnly><AdminCoupons /></ProtectedRoute>} />
            <Route path="charts" element={<ProtectedRoute adminOnly><AdminCharts /></ProtectedRoute>} />
            <Route path="ratios" element={<ProtectedRoute adminOnly><AdminRatios /></ProtectedRoute>} />
            <Route path="revenue" element={<ProtectedRoute adminOnly><AdminRevenue /></ProtectedRoute>} />
          </Route>

          <Route path="/dashboard" element={<Navigate to="/admin/overview" replace />} />

          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </Suspense>

      {isAuthModalOpen && (
        <Auth
          onSuccess={(u, token) => {
            setUser(u);
            localStorage.setItem('sportequip-access-token', token);
            setIsAuthModalOpen(false);
          }}
          onRegisterSuccess={(u, token) => {
            setUser(u);
            localStorage.setItem('sportequip-access-token', token);
            setIsAuthModalOpen(false);
            setShippingAddress(null);
            setIsNewUser(true);
          }}
          onClose={() => setIsAuthModalOpen(false)}
        />
      )}

      <ToastContainer position="bottom-right" theme={isDark ? 'dark' : 'light'} />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppShell />
      </AppProvider>
    </BrowserRouter>
  );
}
