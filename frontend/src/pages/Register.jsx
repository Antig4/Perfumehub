import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';

export default function Register() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', password_confirmation: '', role: 'customer' });

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
  const { data } = await api.post('/register', formData);
  const token = data.access_token || data.token || null;
  setAuth(data.user, token);
      toast.success('Account created successfully!');
      navigate('/');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <h2 className="mt-6 text-center text-4xl font-serif text-white">Create Account</h2>
        <p className="mt-2 text-center text-sm text-gray-400">
          Already have an account? <Link to="/login" className="font-medium text-primary-400 hover:text-primary-300">Sign in</Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="glass-card py-8 px-4 shadow-2xl sm:px-10">
          <form className="space-y-5" onSubmit={handleRegister}>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
              <input type="text" required className="input-field" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Email address</label>
              <input type="email" required className="input-field" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
              <input type="password" required className="input-field" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Confirm Password</label>
              <input type="password" required className="input-field" value={formData.password_confirmation} onChange={e => setFormData({...formData, password_confirmation: e.target.value})} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">I want to register as a:</label>
              <select className="input-field" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                <option value="customer">Shopper</option>
                <option value="seller">Seller / Boutique Owner</option>
                <option value="rider">Delivery Rider</option>
              </select>
            </div>

            <button type="submit" disabled={loading} className="w-full btn-primary py-3 mt-2">
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
