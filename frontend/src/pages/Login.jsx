import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';

export default function Login() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/login', formData);
      setAuth(data.user, data.token);
      toast.success('Welcome back!');
      navigate('/');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <img src="https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=2000" className="w-full h-full object-cover mix-blend-overlay blur-sm" alt="bg" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <h2 className="mt-6 text-center text-4xl font-serif text-white">Sign In</h2>
        <p className="mt-2 text-center text-sm text-gray-400">
          Or <Link to="/register" className="font-medium text-primary-400 hover:text-primary-300 transition">create a new account</Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="glass-card py-8 px-4 shadow-2xl sm:px-10">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Email address</label>
              <input 
                type="email" required 
                className="input-field" 
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
              <input 
                type="password" required 
                className="input-field" 
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
              />
            </div>

            <button type="submit" disabled={loading} className="w-full btn-primary py-3">
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-700" /></div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-navy-900 text-gray-500">Test Accounts</span>
              </div>
            </div>
            <div className="mt-4 text-center text-xs text-gray-400 space-y-1">
              <p>Admin: admin@perfumehub.com | password</p>
              <p>Seller: luxe@perfumehub.com | password</p>
              <p>Customer: maria@example.com | password</p>
              <p>Rider: carlos@rider.com | password</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
