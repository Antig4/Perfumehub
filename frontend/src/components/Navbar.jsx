import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { ShoppingBag, Search, Menu, User, LogOut } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getDashboardLink = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'admin': return '/admin/dashboard';
      case 'seller': return '/seller/dashboard';
      case 'rider': return '/rider/dashboard';
      default: return '/profile';
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-navy-950/80 backdrop-blur-lg border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="font-serif text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-400 to-primary-600">
              PerfumeHub
            </span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/catalog" className="nav-link">Shop All</Link>
            <Link to="/brands" className="nav-link">Brands</Link>
            <Link to="/trending" className="nav-link">Trending</Link>
          </div>

          {/* Desktop Right Actions */}
          <div className="hidden md:flex items-center space-x-6">
            <button className="text-gray-300 hover:text-white transition group">
              <Search className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>
            
            {user?.role === 'customer' || !user ? (
              <Link to="/cart" className="text-gray-300 hover:text-primary-400 transition relative group">
                <ShoppingBag className="w-5 h-5 group-hover:scale-110 transition-transform" />
                {/* Badge placeholder */}
              </Link>
            ) : null}

            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <Link to={getDashboardLink()} className="text-sm font-medium text-gray-300 hover:text-white flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {user?.name}
                </Link>
                <button onClick={handleLogout} className="text-gray-500 hover:text-red-400 transition">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <Link to="/login" className="btn-primary py-1.5 px-5 text-sm">
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-4">
            <Link to="/cart" className="text-gray-300">
              <ShoppingBag className="w-6 h-6" />
            </Link>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-300">
              <Menu className="w-6 h-6" />
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="md:hidden bg-navy-900 border-t border-white/5 py-4 px-4 space-y-4">
          <Link to="/catalog" className="block nav-link text-lg">Shop All</Link>
          <Link to="/brands" className="block nav-link text-lg">Brands</Link>
          {isAuthenticated ? (
            <>
              <Link to={getDashboardLink()} className="block nav-link text-lg text-primary-400">My Account</Link>
              <button onClick={handleLogout} className="text-red-400 text-lg w-full text-left font-medium">Log out</button>
            </>
          ) : (
            <Link to="/login" className="block text-primary-400 text-lg font-medium">Sign In</Link>
          )}
        </div>
      )}
    </nav>
  );
}
