import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useNotificationStore } from '../stores/notificationStore';
import { ShoppingBag, ShoppingCart, Search, Menu, User, LogOut, Heart, Bell, Check, Clock, Package, Truck, AlertCircle } from 'lucide-react';
import api from '../api/axios';

import OrderPreview from './OrderPreview';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { notifications, total, fetch, markRead, loading } = useNotificationStore();
  const [wishlistCount, setWishlistCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const lastWishlistStateRef = useRef({});
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewOrderId, setPreviewOrderId] = useState(null);
  const [deliveryStatusMap, setDeliveryStatusMap] = useState({});

  // Live Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef(null);
  const [fetchingStatus, setFetchingStatus] = useState({});
  const [acceptLoading, setAcceptLoading] = useState({});

  // We used to fetch individual order status during render which caused many
  // concurrent requests and triggered backend rate limits (429). Instead
  // populate `deliveryStatusMap` in a controlled batch when the dropdown
  // opens (see useEffect below). Keep a small fetching map for UI state.

  const renderDeliveryAction = (n) => {
    // prefer delivery_status embedded in notification, then cached map
    const status = n.data?.delivery_status || deliveryStatusMap[n.id];
    if (status === 'delivered') {
      return <button disabled className="py-1 px-3 text-sm bg-green-700 text-white rounded">Delivery Completed</button>;
    }
    // if unknown, show checking state and ensure we fetch it
    if (!n.data?.delivery_status && !deliveryStatusMap[n.id]) {
      // Do NOT trigger network calls during render. The notifOpen effect
      // will fetch statuses when the dropdown opens. Show a passive Checking
      // state until the map is populated.
      return <button disabled className="py-1 px-3 text-sm bg-gray-600 text-white rounded">{fetchingStatus[n.id] ? 'Checking...' : 'Checking...'}</button>;
    }

    // Otherwise show Accept button
    return (
      <button disabled={!!acceptLoading[n.id]} onClick={async () => {
        try {
          setAcceptLoading(s => ({ ...s, [n.id]: true }));

          // Preflight: confirm current token corresponds to a rider
          let meUser = user;
          try {
            const meRes = await api.get('/me');
            meUser = meRes.data?.user || meRes.data || meUser;
          } catch (meErr) {
            if (meErr?.response?.status === 401) {
              // token invalid/expired
              toast.error('Not authenticated. Please sign in again.');
              logout();
              return;
            }
            // ignore other /me failures and proceed — server will reject if unauthorized
          }

          if (!meUser || meUser.role !== 'rider') {
            toast.error('Insufficient permissions: you must be a rider to accept deliveries.');
            return;
          }

          // Re-check delivery/order status to avoid accepting a completed delivery
            const check = await api.get(`/orders/${n.data.order_id}/status`);
          const payload = check.data && check.data.data ? check.data.data : check.data;
          const currentStatus = payload?.delivery?.status || payload?.status || null;
          if (currentStatus === 'delivered') {
            setDeliveryStatusMap(s => ({ ...s, [n.id]: 'delivered' }));
            toast.success('Delivery already completed.');
            await markRead(n.id);
            fetch();
            return;
          }

          await api.put(`/rider/deliveries/${n.data.delivery_id}/status`, { status: 'picked_up' });
          toast.success('Delivery accepted.');
          await markRead(n.id);
          fetch();
          navigate('/rider/deliveries');
        } catch (err) {
          // show detailed server error when available and log to console for debugging
          console.error('Accept delivery error', err);
          if (err?.response?.status === 401) {
            toast.error('Not authenticated. Please sign in again.');
            logout();
          } else if (err?.response?.status === 403) {
            const msg = err?.response?.data?.message || 'Insufficient permissions.';
            toast.error(msg);
          } else {
            const msg = err?.response?.data?.message || err?.message || 'Failed to accept delivery';
            toast.error(msg);
          }
        } finally {
          setAcceptLoading(s => ({ ...s, [n.id]: false }));
        }
      }} className="btn-primary py-1 px-3 text-sm">
        {acceptLoading[n.id] ? '...' : 'Accept'}
      </button>
    );
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSearchSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalog?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setIsSearchFocused(false);
    }
  };

  // Close search on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Live Search Debounce
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const { data } = await api.get(`/products?search=${encodeURIComponent(searchQuery)}&per_page=6`);
        setSearchResults(data.data || data || []);
      } catch (err) {
        console.error('Live search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    // only fetch and start polling if authenticated
    if (isAuthenticated) {
      fetch();
      useNotificationStore.getState().startPolling();
      // load wishlist count and cart count
      (async () => {
        try {
          const [wRes, cRes] = await Promise.allSettled([api.get('/wishlist'), api.get('/cart')]);
          if (wRes.status === 'fulfilled') {
            const wdata = wRes.value.data?.data || wRes.value.data || [];
            setWishlistCount(Array.isArray(wdata) ? wdata.length : 0);
          }
          if (cRes.status === 'fulfilled') {
            const cdata = cRes.value.data?.data || cRes.value.data || [];
            setCartCount(Array.isArray(cdata) ? cdata.length : 0);
          }
        } catch (e) {
          // ignore
        }
      })();

      const onUpdate = (e) => {
        const detail = e.detail || {};
        // Support multiple event shapes: { count }, { delta }, or { productId, in_wishlist }
        if (typeof detail.count === 'number') {
          // authoritative count -- reset dedupe map
          lastWishlistStateRef.current = {};
          setWishlistCount(detail.count);
          return;
        }
        if (typeof detail.delta === 'number') {
          setWishlistCount(c => Math.max(0, c + detail.delta));
          return;
        }

        const { productId, in_wishlist } = detail;
        if (productId && typeof in_wishlist === 'boolean') {
          const last = lastWishlistStateRef.current[productId];
          // ignore duplicate events for same product (optimistic + final)
          if (last === in_wishlist) return;
          lastWishlistStateRef.current[productId] = in_wishlist;
          setWishlistCount(c => (in_wishlist ? c + 1 : Math.max(0, c - 1)));
          return;
        }

        // fallback: older events that only include in_wishlist without productId
        if (typeof detail.in_wishlist === 'boolean') {
          setWishlistCount(c => (detail.in_wishlist ? c + 1 : Math.max(0, c - 1)));
        }
      };
      window.addEventListener('wishlist:updated', onUpdate);

      const onCartUpdate = (e) => {
        // accept event shapes: { count }, { delta }, or { in_cart }
        const detail = e.detail || {};
        if (typeof detail.count === 'number') {
          setCartCount(detail.count);
        } else if (typeof detail.delta === 'number') {
          setCartCount(c => Math.max(0, c + detail.delta));
        } else if (typeof detail.in_cart === 'boolean') {
          setCartCount(c => (detail.in_cart ? c + 1 : Math.max(0, c - 1)));
        }
      };
      window.addEventListener('cart:updated', onCartUpdate);

      return () => {
        useNotificationStore.getState().stopPolling();
        window.removeEventListener('wishlist:updated', onUpdate);
        window.removeEventListener('cart:updated', onCartUpdate);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  useEffect(() => {
    function onDoc(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    }
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  // When notifications dropdown opens and notifications are loaded, fetch delivery status for delivery_assigned notifications
  useEffect(() => {
    if (!notifOpen) return;
    if (!notifications || notifications.length === 0) return; // wait for notifications to be present
    const assigned = (notifications || []).filter(n => n.type === 'delivery_assigned' && n.data?.order_id && !deliveryStatusMap[n.id]);
    if (!assigned.length) return;
    let mounted = true;

    // Process in small concurrent batches to avoid hitting backend rate limits.
    const BATCH_SIZE = 4; // number of concurrent requests
    const DELAY_MS = 250; // delay between batches

    const runBatches = async () => {
      for (let i = 0; i < assigned.length; i += BATCH_SIZE) {
        const batch = assigned.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(async (n) => {
            try {
            setFetchingStatus(s => ({ ...s, [n.id]: true }));
            const res = await api.get(`/orders/${n.data.order_id}/status`);
            if (!mounted) return;
            const payload = res.data && res.data.data ? res.data.data : res.data;
            const status = payload?.delivery?.status || payload?.status || null;
            setDeliveryStatusMap(s => ({ ...s, [n.id]: status }));
          } catch (err) {
            // ignore per-notification failures
          } finally {
            setFetchingStatus(s => ({ ...s, [n.id]: false }));
          }
        }));
        if (!mounted) break;
        // small pause between batches
        await new Promise(r => setTimeout(r, DELAY_MS));
      }
    };

    runBatches();

    return () => { mounted = false; };
  }, [notifOpen, notifications]);

  const getDashboardLink = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'admin': return '/admin/dashboard';
      case 'seller': return '/seller/dashboard';
      case 'rider': return '/rider/dashboard';
      default: return '/profile';
    }
  };

  const getOrdersLink = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'seller': return '/seller/orders';
      case 'rider': return '/rider/deliveries';
      case 'admin': return '/admin/dashboard';
      default: return '/orders';
    }
  };

  const showPublicLinks = !isAuthenticated || user?.role === 'customer';

  return (
    <nav className="sticky top-0 z-50 bg-navy-950/80 backdrop-blur-lg border-b border-white/5">
      <div className="max-w-none mx-auto px-4 sm:px-6 lg:px-12">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="font-serif text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-400 to-primary-600">
              PerfumeHub
            </span>
          </Link>

          {/* Desktop Links & Search */}
          <div className="hidden lg:flex items-center flex-1 ml-10 mr-8 gap-8">
            {showPublicLinks && (
              <>
                <div className="flex items-center space-x-6">
                  <NavLink to="/catalog" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>Shop All</NavLink>
                  <NavLink to="/brands" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>Brands</NavLink>
                  <NavLink to="/trending" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>Trending</NavLink>
                </div>

                {/* Expanded Live Search Bar */}
                <div className="relative flex-1 max-w-xl" ref={searchRef}>
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSearchSubmit(e); }}
                    placeholder="Search fragrances, brands, or notes..." 
                    className="w-full bg-navy-900 border border-white/10 rounded-full py-2.5 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-primary-500 transition-all"
                  />
                  
                  {/* Live Search Dropdown - Solid Background */}
                  {isSearchFocused && searchQuery.trim().length >= 2 && (
                    <div className="absolute top-full left-0 right-0 mt-3 bg-navy-950 border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden z-[60] animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="p-3 border-b border-white/5 bg-navy-900 flex items-center justify-between">
                        <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Suggestions</span>
                        {isSearching && <div className="w-3 h-3 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />}
                      </div>
                      
                      <div className="max-h-[420px] overflow-auto custom-scrollbar">
                        {searchResults.length > 0 ? (
                          <div className="py-1">
                            {searchResults.map(product => (
                              <button 
                                key={product.id}
                                onClick={() => {
                                  navigate(`/products/${product.id}`);
                                  setSearchQuery('');
                                  setIsSearchFocused(false);
                                }}
                                className="w-full px-4 py-3 hover:bg-white/[0.03] flex items-center gap-4 text-left transition-colors group"
                              >
                                <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-navy-900 border border-white/5">
                                  <img 
                                    src={product.primaryImage?.image_url || product.primary_image?.image_url || 'https://via.placeholder.com/100'} 
                                    alt={product.name} 
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                  />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium text-white truncate group-hover:text-primary-400 transition-colors">{product.name}</p>
                                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">{product.brand?.name}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-white font-bold">₱{Number(product.price).toLocaleString()}</p>
                                  <p className="text-[9px] text-gray-500">View Detail →</p>
                                </div>
                              </button>
                            ))}
                            <button 
                              onClick={(e) => handleSearchSubmit(e)}
                              className="w-full py-3 text-center text-xs font-semibold text-primary-400 hover:text-white hover:bg-primary-500/10 transition-all border-t border-white/5"
                            >
                              See all results for "{searchQuery}"
                            </button>
                          </div>
                        ) : !isSearching && (
                          <div className="p-10 text-center">
                            <Search className="w-8 h-8 text-gray-600 mx-auto mb-3 opacity-20" />
                            <p className="text-sm text-gray-500">No fragrances found matching "{searchQuery}"</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Desktop Right Actions */}
          <div className="hidden md:flex items-center space-x-6 overflow-visible">
            {/* Search bar removed from here as it's now in the center */}
            {isAuthenticated && user?.role !== 'admin' && (
              <div className="relative" ref={notifRef}>
                <button aria-label={`Notifications, ${ (notifications || []).filter(n => !n.read_at).length } unread`} onClick={() => { if (isAuthenticated) fetch(); setNotifOpen(v => !v); }} className="text-gray-300 hover:text-white transition relative group flex items-center">
                  {/* Icon container: icon will crossfade into text on hover (in-place) */}
                    <div className="w-14 flex items-center justify-center relative">
                    <span className="inline-flex items-center justify-center transition-all duration-200 transform group-hover:opacity-0 group-hover:scale-75 text-gray-300 group-hover:text-primary-400 transition-colors duration-200">
                      <Bell className="w-5 h-5" />
                    </span>
                    <span className="absolute inset-0 flex items-center justify-center text-sm text-gray-300 opacity-0 pointer-events-none transition-all duration-200 group-hover:opacity-100 group-hover:scale-100 group-hover:text-primary-400 transition-colors duration-200">Notifications</span>
                  </div>
                  {/* Animated unread badge */}
                  { (notifications || []).filter(n => !n.read_at).length > 0 && (
                    <span aria-hidden className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-bold animate-pulse">
                      {(notifications || []).filter(n => !n.read_at).length}
                    </span>
                  )}
                  {/* (label is now in-place inside the icon container) */}
                </button>
                {/* Professional Dropdown - Solid Background */}
                {notifOpen && (
                  <div className="absolute right-0 mt-3 w-[380px] bg-navy-950 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-4 border-b border-white/5 bg-navy-900 flex items-center justify-between">
                      <div>
                        <h4 className="text-white font-semibold">Notifications</h4>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">Recent Activity</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={async () => { await useNotificationStore.getState().markAll(); }} 
                          className="text-xs text-primary-400 hover:text-primary-300 transition-colors font-medium"
                        >
                          Mark all as read
                        </button>
                      </div>
                    </div>

                    <div className="max-h-[450px] overflow-auto custom-scrollbar" onScroll={async (e) => {
                      const el = e.target;
                      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10) {
                        const store = useNotificationStore.getState();
                        if (!store.loading && store.page < store.lastPage) {
                          await store.fetch(store.page + 1, true);
                        }
                      }
                    }}>
                      {(notifications || []).length === 0 ? (
                        <div className="py-12 text-center">
                          <Bell className="w-8 h-8 text-gray-600 mx-auto mb-3 opacity-20" />
                          <p className="text-sm text-gray-500">No notifications yet</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-white/5">
                          {notifications.map(n => {
                            const isUnread = !n.read_at;
                            return (
                              <div 
                                key={n.id} 
                                className={`group p-4 transition-all duration-300 hover:bg-white/[0.03] relative ${isUnread ? 'bg-primary-500/[0.02]' : ''}`}
                              >
                                {isUnread && (
                                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500 rounded-r-full" />
                                )}
                                
                                <div className="flex items-start gap-3">
                                  <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                    isUnread ? 'bg-primary-500/20 text-primary-400' : 'bg-white/5 text-gray-500'
                                  }`}>
                                    {n.type === 'delivery_assigned' ? <Truck className="w-4 h-4" /> : 
                                     n.type === 'order_status' ? <Package className="w-4 h-4" /> : 
                                     <Bell className="w-4 h-4" />}
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start gap-2 mb-1">
                                      <h5 className={`text-sm font-medium truncate ${isUnread ? 'text-white' : 'text-gray-400'}`}>
                                        {n.title}
                                      </h5>
                                      <span className="text-[10px] text-gray-500 whitespace-nowrap mt-0.5">
                                        {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    </div>
                                    
                                    <p className={`text-xs leading-relaxed mb-3 ${isUnread ? 'text-gray-300' : 'text-gray-500'}`}>
                                      {n.message}
                                    </p>

                                    {n.type === 'delivery_assigned' && n.data?.items && (
                                      <div className="bg-white/5 rounded-lg p-2 mb-3 space-y-1">
                                        {n.data.items.slice(0, 2).map(item => (
                                          <div key={item.id} className="flex justify-between text-[10px] text-gray-400">
                                            <span className="truncate">{item.product_name}</span>
                                            <span>x{item.quantity}</span>
                                          </div>
                                        ))}
                                        {n.data.items.length > 2 && (
                                          <div className="text-[10px] text-gray-500 italic">+{n.data.items.length - 2} more items</div>
                                        )}
                                      </div>
                                    )}

                                    <div className="flex items-center gap-3">
                                      {n.data?.order_id && (
                                        <button 
                                          onClick={async (e) => {
                                            e.stopPropagation();
                                            await markRead(n.id);
                                            setNotifOpen(false);
                                            if (user?.role === 'seller') {
                                              navigate(`/seller/orders/${n.data.order_id}`);
                                            } else if (user?.role === 'rider') {
                                              navigate(`/rider/deliveries`);
                                            } else {
                                              navigate(`/orders`);
                                            }
                                          }} 
                                          className="text-[11px] font-semibold text-primary-400 hover:text-primary-300 transition-colors flex items-center gap-1"
                                        >
                                          View details
                                        </button>
                                      )}
                                      {n.type === 'delivery_assigned' && n.data?.delivery_id && (
                                        <div className="flex-1">{renderDeliveryAction(n)}</div>
                                      )}
                                      {isUnread && (
                                        <button 
                                          onClick={async () => { await markRead(n.id); }} 
                                          className="text-[11px] font-medium text-gray-500 hover:text-white transition-colors ml-auto opacity-0 group-hover:opacity-100"
                                        >
                                          Mark read
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    
                    <div className="p-3 bg-white/5 border-t border-white/5 text-center">
                      <button 
                        onClick={() => { setNotifOpen(false); navigate(user?.role === 'customer' ? '/profile' : '/orders'); }}
                        className="text-[11px] text-gray-400 hover:text-white transition-colors"
                      >
                        See all activity
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {user?.role === 'customer' || !user ? (
              <Link to="/cart" id="navbar-cart-icon" className="text-gray-300 hover:text-primary-400 transition relative group flex items-center">
                <div className="w-14 flex items-center justify-center relative">
                  <span className="inline-flex items-center justify-center transition-all duration-200 transform group-hover:opacity-0 group-hover:scale-75 text-gray-300 group-hover:text-primary-400 transition-colors duration-200">
                    <ShoppingCart className="w-5 h-5" />
                  </span>
                  <span className="absolute inset-0 flex items-center justify-center text-sm text-gray-300 opacity-0 pointer-events-none transition-all duration-200 group-hover:opacity-100 group-hover:scale-100 group-hover:text-primary-400 transition-colors duration-200">Cart</span>
                  {cartCount > 0 && (
                    <span aria-hidden className="absolute -top-3 -right-1 inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-primary-500 text-white text-xs font-bold">{cartCount}</span>
                  )}
                </div>
              </Link>
            ) : null}

            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                {user?.role === 'customer' && (
                  <>
                    <Link to={getOrdersLink()} className="text-sm font-medium text-gray-300 hover:text-white group relative">
                      <div className="w-14 flex items-center justify-center relative">
                        <span className="inline-flex items-center justify-center transition-all duration-200 transform group-hover:opacity-0 group-hover:scale-75 text-gray-300 group-hover:text-primary-400 transition-colors duration-200">
                          <ShoppingBag className="w-5 h-5" />
                        </span>
                        <span className="absolute inset-0 flex items-center justify-center text-sm text-gray-300 opacity-0 pointer-events-none transition-all duration-200 group-hover:opacity-100 group-hover:scale-100 group-hover:text-primary-400 transition-colors duration-200">Orders</span>
                      </div>
                    </Link>
                    <Link to="/wishlist" className="text-sm font-medium text-gray-300 hover:text-white relative group flex items-center">
                      <div className="w-14 flex items-center justify-center relative">
                        <span className="inline-flex items-center justify-center transition-all duration-200 transform group-hover:opacity-0 group-hover:scale-75 text-gray-300 group-hover:text-primary-400 transition-colors duration-200">
                          <Heart className="w-5 h-5" />
                        </span>
                        <span className="absolute inset-0 flex items-center justify-center text-sm text-gray-300 opacity-0 pointer-events-none transition-all duration-200 group-hover:opacity-100 group-hover:scale-100 group-hover:text-primary-400 transition-colors duration-200">Wishlist</span>
                        {wishlistCount > 0 && (
                          <span aria-hidden className="absolute -top-3 -right-1 inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-primary-500 text-white text-xs font-bold">{wishlistCount}</span>
                        )}
                      </div>
                    </Link>
                  </>
                )}
                {user?.role !== 'customer' && (
                  <Link to={getDashboardLink()} className="text-sm font-medium text-gray-300 hover:text-white">
                    Dashboard
                  </Link>
                )}
                <Link to="/profile" className="text-sm font-medium text-gray-300 hover:text-white flex items-center gap-2">
                  {user?.avatar_url ? (
                    <img src={user?.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover border border-white/20" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-navy-800 flex items-center justify-center border border-white/10">
                      <User className="w-4 h-4 text-gray-400" />
                    </div>
                  )}
                  <span className="hidden lg:inline-block">{user?.name}</span>
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
              {cartCount > 0 && (
                <span className="ml-1 inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-primary-500 text-white text-xs font-bold">{cartCount}</span>
              )}
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
          {showPublicLinks && (
            <>
              <Link to="/catalog" className="block nav-link text-lg">Shop All</Link>
              <Link to="/brands" className="block nav-link text-lg">Brands</Link>
              <Link to="/trending" className="block nav-link text-lg">Trending</Link>
            </>
          )}
          {isAuthenticated ? (
            <>
              {user?.role === 'customer' && (
                  <>
                  <Link to={getOrdersLink()} className="block nav-link text-lg flex items-center gap-2"><ShoppingBag className="w-4 h-4" /> My Orders</Link>
                  <Link to="/wishlist" className="block nav-link text-lg flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2"><Heart className="w-4 h-4" /> <span>Wishlist</span></div>
                    {wishlistCount > 0 && (
                      <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-primary-500 text-white text-xs font-bold">{wishlistCount}</span>
                    )}
                  </Link>
                </>
              )}
              {user?.role !== 'customer' && (
                <Link to={getDashboardLink()} className="block nav-link text-lg">Dashboard</Link>
              )}
              <Link to="/profile" className="block nav-link text-lg text-primary-400">My Profile</Link>
              <button onClick={handleLogout} className="text-red-400 text-lg w-full text-left font-medium">Log out</button>
            </>
          ) : (
            <Link to="/login" className="block text-primary-400 text-lg font-medium">Sign In</Link>
          )}
        </div>
      )}
      <OrderPreview orderId={previewOrderId} open={previewOpen} onClose={() => setPreviewOpen(false)} />
    </nav>
  );
}
