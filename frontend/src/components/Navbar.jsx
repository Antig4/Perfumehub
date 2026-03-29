import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useNotificationStore } from '../stores/notificationStore';
import { ShoppingBag, ShoppingCart, Search, Menu, User, LogOut, Heart, Bell } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import LoadingSpinner from './LoadingSpinner';
import OrderPreview from './OrderPreview';
import api from '../api/axios';
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
  const [acceptLoading, setAcceptLoading] = useState({});
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewOrderId, setPreviewOrderId] = useState(null);
  const [deliveryStatusMap, setDeliveryStatusMap] = useState({});
  const [fetchingStatus, setFetchingStatus] = useState({});

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
        {acceptLoading[n.id] ? <LoadingSpinner size={0.9} /> : 'Accept'}
      </button>
    );
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

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
            {showPublicLinks && (
              <>
                <NavLink to="/catalog" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>Shop All</NavLink>
                <NavLink to="/brands" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>Brands</NavLink>
                <NavLink to="/trending" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>Trending</NavLink>
              </>
            )}
          </div>

          {/* Desktop Right Actions */}
          <div className="hidden md:flex items-center space-x-6 overflow-visible">
            <button className="text-gray-300 hover:text-white transition group">
              <Search className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>
            {isAuthenticated && (
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
                {/* Dropdown */}
                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-navy-900 border border-white/5 rounded shadow-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm text-gray-400">Notifications</h4>
                      <div className="flex items-center gap-2">
                        <button onClick={async () => { await useNotificationStore.getState().markAll(); }} className="text-xs text-primary-400 hover:underline">Mark all as read</button>
                        {useNotificationStore.getState().loading ? <LoadingSpinner size={1.25} /> : null}
                      </div>
                      </div>
                    <div ref={el => { /* attach scroll listener via closure below */ }} className="space-y-2 max-h-64 overflow-auto" onScroll={async (e) => {
                      // infinite scroll: when scrolled to bottom, fetch next page and append
                      const el = e.target;
                      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10) {
                        const store = useNotificationStore.getState();
                        if (!store.loading && store.page < store.lastPage) {
                          await store.fetch(store.page + 1, true);
                        }
                      }
                    }}>
                      {(notifications || []).length === 0 && <div className="text-sm text-gray-500">No notifications</div>}
                      {notifications.map(n => (
                        <div key={n.id} className={`p-3 rounded-md border ${n.read_at ? 'border-transparent bg-navy-900/40 opacity-70' : 'border-white/5 bg-navy-950/40 shadow-sm'}`}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="font-semibold text-white">{n.title}</div>
                              <div className="text-xs text-gray-400 mt-1">{n.message}</div>
                              {n.type === 'delivery_assigned' && n.data?.items && (
                                <div className="mt-2 text-sm text-gray-300">
                                  <div className="text-xs text-primary-400 mb-1">Items:</div>
                                  {n.data.items.map(item => (
                                    <div key={item.id} className="flex justify-between text-sm border-b border-white/5 py-1">
                                      <div className="truncate">{item.product_name} x{item.quantity}</div>
                                      <div className="text-gray-400">#{item.product_id}</div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex-shrink-0 text-right">
                              <div className="text-xs text-gray-400">{new Date(n.created_at).toLocaleString()}</div>
                              <div className="mt-2 flex flex-col items-end gap-2">
                                {!n.read_at && <button onClick={async () => { await markRead(n.id); }} className="text-xs text-primary-400">Mark read</button>}
                                {n.data?.order_id && (
                                  <button onClick={async () => {
                                    await markRead(n.id);
                                    if (user?.role === 'seller') {
                                      setPreviewOrderId(n.data.order_id);
                                      setPreviewOpen(true);
                                    } else {
                                      navigate(`/orders/${n.data.order_id}`);
                                    }
                                  }} className="text-xs text-primary-300">View order</button>
                                )}
                                {n.type === 'delivery_assigned' && n.data?.delivery_id && (
                                  renderDeliveryAction(n)
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {user?.role === 'customer' || !user ? (
              <Link to="/cart" className="text-gray-300 hover:text-primary-400 transition relative group flex items-center">
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
              <Link to={getDashboardLink()} className="block nav-link text-lg text-primary-400">My Account</Link>
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
