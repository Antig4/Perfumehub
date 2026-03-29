import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './stores/authStore';
import { Toaster } from 'react-hot-toast';

import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import ProductDetail from './pages/ProductDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderHistory from './pages/OrderHistory';
import Wishlist from './pages/Wishlist';

import SellerDashboard from './pages/seller/Dashboard';
import SellerProducts from './pages/seller/Products';
import AddEditProduct from './pages/seller/AddEditProduct';
import SellerOrders from './pages/seller/Orders';
import OrderDetail from './pages/seller/OrderDetail';

import RiderDashboard from './pages/rider/Dashboard';
import Deliveries from './pages/rider/Deliveries';

import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminSellers from './pages/admin/Sellers';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, isLoading } = useAuthStore();
  
  if (isLoading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  const fetchUser = useAuthStore(state => state.fetchUser);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{
        className: 'bg-navy-900 text-white border border-gray-800',
      }} />
      <Layout>
        <ErrorBoundary>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Customer / Authenticated Routes */}
          <Route path="/cart" element={<ProtectedRoute allowedRoles={['customer']}><Cart /></ProtectedRoute>} />
          <Route path="/checkout" element={<ProtectedRoute allowedRoles={['customer']}><Checkout /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute allowedRoles={['customer', 'seller', 'admin']}><OrderHistory /></ProtectedRoute>} />
            <Route path="/wishlist" element={<ProtectedRoute allowedRoles={['customer']}><Wishlist /></ProtectedRoute>} />
          
          {/* Seller Routes */}
          <Route path="/seller/dashboard" element={<ProtectedRoute allowedRoles={['seller']}><SellerDashboard /></ProtectedRoute>} />
          <Route path="/seller/products" element={<ProtectedRoute allowedRoles={['seller']}><SellerProducts /></ProtectedRoute>} />
          <Route path="/seller/products/new" element={<ProtectedRoute allowedRoles={['seller']}><AddEditProduct /></ProtectedRoute>} />
          <Route path="/seller/products/:id/edit" element={<ProtectedRoute allowedRoles={['seller']}><AddEditProduct /></ProtectedRoute>} />
          <Route path="/seller/orders" element={<ProtectedRoute allowedRoles={['seller']}><SellerOrders /></ProtectedRoute>} />
          <Route path="/seller/orders/:id" element={<ProtectedRoute allowedRoles={['seller']}><OrderDetail /></ProtectedRoute>} />

          {/* Rider Routes */}
          <Route path="/rider/dashboard" element={<ProtectedRoute allowedRoles={['rider']}><RiderDashboard /></ProtectedRoute>} />
          <Route path="/rider/deliveries" element={<ProtectedRoute allowedRoles={['rider']}><Deliveries /></ProtectedRoute>} />

          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><AdminUsers /></ProtectedRoute>} />
          <Route path="/admin/sellers" element={<ProtectedRoute allowedRoles={['admin']}><AdminSellers /></ProtectedRoute>} />

          {/* Default fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </ErrorBoundary>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
