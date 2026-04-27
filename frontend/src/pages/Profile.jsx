import { useState, useRef } from 'react';
import { useAuthStore } from '../stores/authStore';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { User, Camera, Lock, MapPin } from 'lucide-react';
import MapPicker from '../components/MapPicker';
import MapViewer from '../components/MapViewer';

export default function Profile() {
  const { user, fetchUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || ''
  });
  
  const [passData, setPassData] = useState({
    current_password: '',
    password: '',
    password_confirmation: ''
  });
  
  const fileInputRef = useRef();
  const [mapOpen, setMapOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [mapCoords, setMapCoords] = useState(
    user?.lat && user?.lng ? { lat: user.lat, lng: user.lng } : null
  );

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/profile', {
        ...formData,
        lat: mapCoords?.lat || null,
        lng: mapCoords?.lng || null,
      });
      await fetchUser();
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setPassLoading(true);
    try {
      await api.put('/profile/password', passData);
      toast.success('Password changed successfully');
      setPassData({ current_password: '', password: '', password_confirmation: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPassLoading(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Quick validation
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2MB');
      return;
    }

    const data = new FormData();
    data.append('avatar', file);

    try {
      const promise = api.post('/profile/avatar', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.promise(promise, {
        loading: 'Uploading avatar...',
        success: 'Avatar updated!',
        error: 'Failed to upload avatar'
      });
      await promise;
      await fetchUser();
    } catch (err) {
      // toast handles the error message based on promise
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-serif text-white mb-8">Account Settings</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Avatar Section */}
        <div className="glass-card p-6 flex flex-col items-center text-center">
          <div className="relative group cursor-pointer mb-4" onClick={() => fileInputRef.current?.click()}>
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/10 bg-navy-900 flex items-center justify-center relative shadow-lg">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-16 h-16 text-gray-500" />
              )}
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-8 h-8 text-white mb-1" />
                <span className="text-xs text-white font-medium">Change Photo</span>
              </div>
            </div>
            <input 
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleAvatarChange}
            />
          </div>
          <h3 className="text-lg font-medium text-white">{user?.name}</h3>
          <p className="text-xs text-primary-400 uppercase tracking-wider font-bold mt-1 bg-primary-900/20 px-2 py-0.5 rounded">{user?.role}</p>
          <p className="text-sm text-gray-400 mt-2">{user?.email}</p>
        </div>

        {/* Forms Section */}
        <div className="md:col-span-2 space-y-8">
          
          {/* Profile Form */}
          <div className="glass-card p-6 border border-white/5">
            <h2 className="text-xl font-medium text-white mb-6">Profile Information</h2>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Phone Number</label>
                <input 
                  type="tel" 
                  className="input-field" 
                  value={formData.phone} 
                  onChange={e => setFormData({...formData, phone: e.target.value})} 
                  placeholder="(Optional) e.g., +63 912 345 6789"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Address</label>
                <textarea 
                  className="input-field min-h-[100px] py-3" 
                  value={formData.address} 
                  onChange={e => setFormData({...formData, address: e.target.value})} 
                  placeholder="(Optional) Enter your full delivery address"
                />
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <button type="button" onClick={() => setMapOpen(true)} className="btn-outline text-sm py-1.5 px-3 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" /> Pick on Map
                  </button>
                  {mapCoords && (
                    <>
                      <span className="text-xs text-gray-400">📍 {mapCoords.lat.toFixed(5)}, {mapCoords.lng.toFixed(5)}</span>
                      <button type="button" onClick={() => setViewerOpen(true)} className="text-xs text-primary-400 hover:text-primary-300 transition">Preview</button>
                    </>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1.5">This address will be auto-filled during checkout.</p>
              </div>
              <button disabled={loading} type="submit" className="btn-primary py-2 px-6">
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>

          {/* Password Form */}
          <div className="glass-card p-6 border border-white/5">
            <div className="flex items-center gap-2 mb-6">
              <Lock className="w-5 h-5 text-gray-400" />
              <h2 className="text-xl font-medium text-white">Change Password</h2>
            </div>
            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Current Password</label>
                <input 
                  type="password" 
                  className="input-field" 
                  value={passData.current_password} 
                  onChange={e => setPassData({...passData, current_password: e.target.value})} 
                  required 
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">New Password</label>
                  <input 
                    type="password" 
                    className="input-field" 
                    value={passData.password} 
                    onChange={e => setPassData({...passData, password: e.target.value})} 
                    required 
                    minLength={8}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Confirm New Password</label>
                  <input 
                    type="password" 
                    className="input-field" 
                    value={passData.password_confirmation} 
                    onChange={e => setPassData({...passData, password_confirmation: e.target.value})} 
                    required 
                    minLength={8}
                  />
                </div>
              </div>
              <button disabled={passLoading} type="submit" className="btn-primary py-2 px-6 bg-navy-800 hover:bg-navy-700">
                {passLoading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>

        </div>
      </div>

      {/* Map Picker Modal */}
      <MapPicker 
        open={mapOpen} 
        onClose={() => setMapOpen(false)} 
        initial={mapCoords} 
        onSelect={({ lat, lng, address }) => {
          setMapCoords({ lat, lng });
          if (address) {
            setFormData(prev => ({ ...prev, address }));
          }
          setMapOpen(false);
          toast.success('Address set from map! Click "Save Changes" to save.');
        }} 
      />
      <MapViewer 
        open={viewerOpen} 
        onClose={() => setViewerOpen(false)} 
        initial={mapCoords ? { lat: mapCoords.lat, lng: mapCoords.lng, address: formData.address } : null} 
      />
    </div>
  );
}
