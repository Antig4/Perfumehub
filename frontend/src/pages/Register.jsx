import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';
import { ShoppingBag, Store, Truck, ChevronRight, ChevronLeft, Eye, EyeOff, CheckCircle2, User, Mail, Lock, Phone } from 'lucide-react';

const ROLES = [
  {
    id: 'customer',
    label: 'Shopper',
    icon: ShoppingBag,
    color: 'from-blue-500 to-blue-700',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500',
    text: 'text-blue-400',
    description: 'Browse and purchase luxury perfumes from top sellers.',
    perks: ['Access to all products', 'Track your orders', 'Wishlist & reviews'],
  },
  {
    id: 'seller',
    label: 'Seller / Boutique',
    icon: Store,
    color: 'from-primary-500 to-yellow-600',
    bg: 'bg-primary-500/10',
    border: 'border-primary-500',
    text: 'text-primary-400',
    description: 'List and sell your perfume collection to thousands of buyers.',
    perks: ['List unlimited products', 'Manage your orders', 'Assign delivery riders'],
  },
  {
    id: 'rider',
    label: 'Delivery Rider',
    icon: Truck,
    color: 'from-green-500 to-emerald-700',
    bg: 'bg-green-500/10',
    border: 'border-green-500',
    text: 'text-green-400',
    description: 'Join our delivery fleet and earn by completing deliveries.',
    perks: ['Get delivery assignments', 'Track your earnings', 'Flexible availability'],
  },
];

export default function Register() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [step, setStep] = useState(1); // 1 = pick role, 2 = fill form
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
    role: '',
    // Seller extras
    store_name: '',
    // Rider extras
    vehicle_type: 'Motorcycle',
    vehicle_plate: '',
  });

  const selectedRole = ROLES.find(r => r.id === formData.role);

  const handleRoleSelect = (roleId) => {
    setFormData(f => ({ ...f, role: roleId }));
    setStep(2);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.password_confirmation) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/register', formData);
      const token = data.access_token || data.token || null;
      setAuth(data.user, token);
      toast.success('Account created successfully!');
      // Redirect based on role
      if (formData.role === 'seller') navigate('/seller/dashboard');
      else if (formData.role === 'rider') navigate('/rider/dashboard');
      else navigate('/');
    } catch (e) {
      const errors = e.response?.data?.errors;
      if (errors) {
        const firstError = Object.values(errors)[0]?.[0];
        toast.error(firstError || 'Registration failed');
      } else {
        toast.error(e.response?.data?.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        <Link to="/" className="flex justify-center mb-6">
          <span className="font-serif text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-400 to-primary-600">
            PerfumeHub
          </span>
        </Link>
        <h2 className="text-center text-4xl font-serif text-white mb-2">
          {step === 1 ? 'Join PerfumeHub' : `Create ${selectedRole?.label} Account`}
        </h2>
        <p className="text-center text-sm text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary-400 hover:text-primary-300">Sign in</Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto w-full sm:max-w-2xl px-4">
        {/* Step 1: Role Selection */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-center text-gray-400 text-sm mb-6">Choose how you want to use PerfumeHub:</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {ROLES.map(role => {
                const Icon = role.icon;
                return (
                  <button
                    key={role.id}
                    onClick={() => handleRoleSelect(role.id)}
                    className={`glass-card p-6 text-left border-2 border-transparent hover:${role.border} hover:${role.bg} transition-all group`}
                  >
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${role.color} flex items-center justify-center mb-4 shadow-lg`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-white font-bold text-lg mb-1">{role.label}</h3>
                    <p className="text-gray-400 text-xs mb-4 leading-relaxed">{role.description}</p>
                    <ul className="space-y-1.5">
                      {role.perks.map(perk => (
                        <li key={perk} className="flex items-center gap-2 text-xs text-gray-300">
                          <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${role.text}`} />
                          {perk}
                        </li>
                      ))}
                    </ul>
                    <div className={`mt-5 flex items-center gap-1 text-sm font-medium ${role.text} group-hover:gap-2 transition-all`}>
                      Get started <ChevronRight className="w-4 h-4" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Registration Form */}
        {step === 2 && selectedRole && (
          <div className="glass-card py-8 px-6 sm:px-10 shadow-2xl border border-white/10">
            {/* Role badge + back */}
            <div className="flex items-center gap-3 mb-6 pb-5 border-b border-white/10">
              <button
                onClick={() => setStep(1)}
                className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${selectedRole.color} flex items-center justify-center shadow-md`}>
                {(() => { const Icon = selectedRole.icon; return <Icon className="w-5 h-5 text-white" />; })()}
              </div>
              <div>
                <p className="text-xs text-gray-400">Registering as</p>
                <p className={`font-bold ${selectedRole.text}`}>{selectedRole.label}</p>
              </div>
              {formData.role === 'seller' && (
                <p className="ml-auto text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 rounded px-2 py-1">
                  Requires admin approval
                </p>
              )}
            </div>

            <form className="space-y-4" onSubmit={handleRegister}>
              {/* Common Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" /> Full Name
                  </label>
                  <input
                    type="text" required className="input-field"
                    placeholder="Juan Dela Cruz"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" /> Phone Number
                  </label>
                  <input
                    type="text" className="input-field"
                    placeholder="+63 912 345 6789"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> Email Address
                </label>
                <input
                  type="email" required className="input-field"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" /> Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'} required className="input-field pr-10"
                      placeholder="Min 8 characters"
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                    />
                    <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-3 top-2.5 text-gray-400 hover:text-white">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Confirm Password</label>
                  <input
                    type="password" required className="input-field"
                    placeholder="Re-enter password"
                    value={formData.password_confirmation}
                    onChange={e => setFormData({ ...formData, password_confirmation: e.target.value })}
                  />
                </div>
              </div>

              {/* Seller-specific fields */}
              {formData.role === 'seller' && (
                <div className="pt-2 border-t border-white/10">
                  <p className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wider">Store Information</p>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5" /> Store / Boutique Name
                    </label>
                    <input
                      type="text" className="input-field"
                      placeholder="e.g. Luxe Scents PH"
                      value={formData.store_name}
                      onChange={e => setFormData({ ...formData, store_name: e.target.value })}
                    />
                    <p className="text-xs text-gray-500 mt-1">Leave blank to use your name. Can be changed later.</p>
                  </div>
                </div>
              )}

              {/* Rider-specific fields */}
              {formData.role === 'rider' && (
                <div className="pt-2 border-t border-white/10">
                  <p className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wider">Vehicle Information</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Vehicle Type</label>
                      <select
                        className="input-field"
                        value={formData.vehicle_type}
                        onChange={e => setFormData({ ...formData, vehicle_type: e.target.value })}
                      >
                        <option>Motorcycle</option>
                        <option>Bicycle</option>
                        <option>Car</option>
                        <option>Van</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Plate / ID Number</label>
                      <input
                        type="text" className="input-field"
                        placeholder="e.g. ABC-1234"
                        value={formData.vehicle_plate}
                        onChange={e => setFormData({ ...formData, vehicle_plate: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 mt-2 rounded-xl font-bold text-white text-sm transition-all shadow-lg ${
                  loading ? 'opacity-60 cursor-not-allowed' : 'hover:scale-[1.02]'
                } bg-gradient-to-r ${selectedRole.color}`}
              >
                {loading ? 'Creating Account...' : `Create ${selectedRole.label} Account`}
              </button>

              <p className="text-center text-xs text-gray-500">
                By creating an account you agree to our{' '}
                <span className="text-primary-400 cursor-pointer hover:underline">Terms of Service</span>
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
