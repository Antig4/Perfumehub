import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Truck, UserPlus, UserMinus, Phone, Star } from 'lucide-react';

export default function SellerRiders() {
  const [myRiders, setMyRiders] = useState([]);
  const [availableRiders, setAvailableRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [mine, avail] = await Promise.all([
        api.get('/seller/riders'),
        api.get('/seller/available-riders'),
      ]);
      setMyRiders(mine.data.data || []);
      setAvailableRiders(avail.data.data || []);
    } catch (e) {
      toast.error('Failed to load riders');
    } finally {
      setLoading(false);
    }
  };

  const assignRider = async (userId) => {
    setActionLoading(s => ({ ...s, [userId]: true }));
    try {
      await api.post(`/seller/riders/${userId}/assign`);
      toast.success('Rider assigned to your team!');
      await fetchAll();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to assign rider');
    } finally {
      setActionLoading(s => ({ ...s, [userId]: false }));
    }
  };

  const unassignRider = async (userId) => {
    setActionLoading(s => ({ ...s, [userId]: true }));
    try {
      await api.post(`/seller/riders/${userId}/unassign`);
      toast.success('Rider removed from your team');
      await fetchAll();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to remove rider');
    } finally {
      setActionLoading(s => ({ ...s, [userId]: false }));
    }
  };

  if (loading) return <div className="p-12 text-center text-gray-400">Loading riders...</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-serif text-white">My Delivery Team</h1>
        <p className="text-gray-400 mt-1">Manage your assigned riders (max 3)</p>
      </div>

      {/* My Riders */}
      <div className="glass-card p-6 mb-8">
        <h2 className="text-xl font-medium text-white mb-4 flex items-center gap-2">
          <Truck className="w-5 h-5 text-primary-400" />
          Assigned Riders ({myRiders.length}/3)
        </h2>

        {myRiders.length === 0 ? (
          <div className="text-center py-8">
            <Truck className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No riders assigned yet. Add riders from the available pool below.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {myRiders.map(rider => (
              <div key={rider.id} className="bg-navy-950 border border-white/10 rounded-xl p-5 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 font-bold text-lg">
                    {rider.user?.name?.charAt(0) || 'R'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{rider.user?.name}</p>
                    <p className="text-xs text-gray-400 truncate">{rider.user?.email}</p>
                  </div>
                </div>

                <div className="space-y-1.5 text-sm">
                  {rider.user?.phone && (
                    <p className="text-gray-400 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {rider.user.phone}</p>
                  )}
                  <p className="text-gray-400">Vehicle: <span className="text-white">{rider.vehicle_type || 'N/A'}</span></p>
                  <p className="text-gray-400">Plate: <span className="text-white">{rider.vehicle_plate || 'N/A'}</span></p>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded font-bold ${rider.is_available ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {rider.is_available ? 'Available' : 'On Delivery'}
                    </span>
                    <span className="text-gray-400 flex items-center gap-1 text-xs">
                      <Star className="w-3 h-3 text-yellow-400" /> {Number(rider.rating).toFixed(1)}
                    </span>
                  </div>
                </div>

                <button
                  disabled={!!actionLoading[rider.user_id]}
                  onClick={() => unassignRider(rider.user_id)}
                  className="mt-auto w-full py-2 text-sm font-medium rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition flex items-center justify-center gap-1.5"
                >
                  <UserMinus className="w-4 h-4" />
                  {actionLoading[rider.user_id] ? 'Removing...' : 'Remove from Team'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available Riders */}
      <div className="glass-card p-6">
        <h2 className="text-xl font-medium text-white mb-4 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-green-400" />
          Available Riders
        </h2>

        {availableRiders.length === 0 ? (
          <p className="text-gray-500 text-sm py-4">No unassigned riders available at the moment.</p>
        ) : (
          <div className="space-y-3">
            {availableRiders.map(rider => (
              <div key={rider.id} className="flex items-center justify-between bg-navy-950 border border-white/5 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-bold">
                    {rider.user?.name?.charAt(0) || 'R'}
                  </div>
                  <div>
                    <p className="text-white font-medium">{rider.user?.name}</p>
                    <p className="text-xs text-gray-400">{rider.vehicle_type || 'No vehicle info'} • {rider.user?.phone || 'No phone'}</p>
                  </div>
                </div>
                <button
                  disabled={!!actionLoading[rider.user_id] || myRiders.length >= 3}
                  onClick={() => assignRider(rider.user_id)}
                  className="btn-primary py-2 px-4 text-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  <UserPlus className="w-4 h-4" />
                  {actionLoading[rider.user_id] ? 'Assigning...' : myRiders.length >= 3 ? 'Team Full' : 'Assign'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
