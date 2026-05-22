import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useApp } from '../context/AppContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const { user, isAdmin, isAuthLoading, setIsAuthModalOpen } = useApp();
  const location = useLocation();

  // If not logged in and not loading, open the auth modal and redirect home
  useEffect(() => {
    if (!isAuthLoading && !user) {
      setIsAuthModalOpen(true);
    }
  }, [user, isAuthLoading, setIsAuthModalOpen]);

  if (isAuthLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Logged-in but not admin → send to orders
  if (adminOnly && !isAdmin) {
    return <Navigate to="/orders" replace />;
  }

  return <>{children}</>;
}
