import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { MapPin, Phone, Truck, CheckCircle2, RotateCcw } from 'lucide-react';
import MapViewer from '../../components/MapViewer';
import toast from 'react-hot-toast';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function Deliveries() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const fetchDeliveries = async () => {
    try {
      const { data } = await api.get('/rider/deliveries');
      setDeliveries(data.data); // Sanctum pagination
    } catch (e) {
      toast.error('Failed to load deliveries');
    } finally {
      setLoading(false);
    }
  };

  const [updating, setUpdating] = useState({});
  const [confirmModal, setConfirmModal] = useState({ open: false, id: null, status: null });
  const [viewer, setViewer] = useState({ open: false, delivery: null });

  const requestUpdate = (id, status) => setConfirmModal({ open: true, id, status });

  const updateStatus = async (id, status) => {
    try {
      setUpdating((s) => ({ ...s, [id]: true }));
      await api.put(`/rider/deliveries/${id}/status`, { status });
      toast.success('Delivery status updated');
      await fetchDeliveries();
    } catch (e) {
      console.error('Update delivery status error', e);
      const msg = e?.response?.data?.message || e?.message || 'Failed to update status';
      toast.error(msg);
    } finally {
      setUpdating((s) => ({ ...s, [id]: false }));
      setConfirmModal({ open: false, id: null, status: null });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-serif text-white">My Deliveries</h1>
          <p className="text-gray-400">View and update your assigned routes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-gray-400">Loading deliveries...</div>
        ) : deliveries.length === 0 ? (
          <div className="col-span-full glass-card py-20 text-center">
            <Truck className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <p className="text-xl text-gray-300">No deliveries assigned.</p>
          </div>
        ) : (
          deliveries.map((delivery) => (
            <div key={delivery.id} className="glass-card flex flex-col overflow-hidden">
              <div className="p-5 border-b border-white/5 bg-navy-950/50">
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-xs px-2 py-1 rounded font-bold uppercase flex items-center gap-1 ${
                    delivery.status === 'delivered' ? 'bg-green-500/20 text-green-400' :
                    delivery.status === 'out_for_delivery' || delivery.status === 'picked_up' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {delivery.status.replace(/_/g, ' ')}
                  </span>
                  <span className="text-sm font-bold text-white">#{delivery.order?.order_number}</span>
                </div>
                <p className="text-xs text-gray-400">Assigned: {new Date(delivery.created_at).toLocaleDateString()}</p>
              </div>

              <div className="p-5 flex-1 space-y-4">
                <div>
                  <h4 className="text-xs font-semibold text-primary-400 uppercase tracking-wider mb-2">Customer</h4>
                  <p className="font-medium text-white">{delivery.order?.user?.name}</p>
                  <p className="text-sm text-gray-400 flex items-center gap-2 mt-1">
                    <Phone className="w-3 h-3" />
                    {(delivery.recipient_phone || delivery.order?.user?.phone) ? (
                      <>
                        <a className="hover:underline" href={`tel:${delivery.recipient_phone || delivery.order.user.phone}`}>{delivery.recipient_phone || delivery.order.user.phone}</a>
                        <button onClick={() => { navigator.clipboard?.writeText(delivery.recipient_phone || delivery.order.user.phone); toast.success('Phone copied'); }} className="ml-2 text-xs text-gray-400 hover:text-white">Copy</button>
                      </>
                    ) : 'No phone'}
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-primary-400 uppercase tracking-wider mb-2">Destination</h4>
                  <p className="text-sm text-gray-300 flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                      {(delivery.delivery_address || delivery.order?.user?.address || (delivery.lat && delivery.lng)) ? (
                        <button onClick={() => setViewer({ open: true, delivery })} className="hover:underline text-left">
                          {delivery.delivery_address || delivery.order?.user?.address || `${delivery.lat}, ${delivery.lng}`}
                        </button>
                      ) : 'No address provided'}
                  </p>
                </div>

                {(delivery.notes || delivery.order?.notes) && (
                  <div className="bg-navy-950 p-3 rounded text-sm text-gray-400">
                    <span className="font-medium text-gray-300 block mb-1">Notes:</span>
                    {delivery.notes || delivery.order?.notes}
                  </div>
                )}
              </div>

                <div className="p-5 pt-0 mt-auto grid grid-cols-2 gap-3">
                {/* Map frontend actions to backend statuses: picked_up, out_for_delivery, delivered, failed */}
                {delivery.status === 'assigned' && (
                  <>
                    <button disabled={!!updating[delivery.id]} onClick={() => requestUpdate(delivery.id, 'picked_up')} className="btn-primary py-2 w-full col-span-2">
                      {updating[delivery.id] ? <LoadingSpinner size={1} /> : <><Truck className="w-4 h-4 mr-2" /> Pick Up</>}
                    </button>
                  </>
                )}

                {delivery.status === 'picked_up' && (
                  <>
                    {/* Riders are not allowed to set status back to 'assigned' (admin-only). Show only forward action */}
                    <button disabled={!!updating[delivery.id]} onClick={() => requestUpdate(delivery.id, 'out_for_delivery')} className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 rounded-lg transition text-xs flex items-center justify-center col-span-2">
                      {updating[delivery.id] ? <LoadingSpinner size={1} /> : <><Truck className="w-4 h-4 mr-1" /> Out for Delivery</>}
                    </button>
                  </>
                )}

                {delivery.status === 'out_for_delivery' && (
                  <>
                    <button disabled={!!updating[delivery.id]} onClick={() => requestUpdate(delivery.id, 'picked_up')} className="btn-outline py-2 w-full text-xs">
                      <RotateCcw className="w-3 h-3 mr-1" /> Revert
                    </button>
                    <button disabled={!!updating[delivery.id]} onClick={() => requestUpdate(delivery.id, 'delivered')} className="bg-green-600 hover:bg-green-500 text-white font-medium py-2 rounded-lg transition text-xs flex items-center justify-center">
                      {updating[delivery.id] ? <LoadingSpinner size={1} /> : <><CheckCircle2 className="w-4 h-4 mr-1" /> Complete</>}
                    </button>
                  </>
                )}

                {delivery.status === 'delivered' && (
                  <div className="col-span-2 text-center text-sm font-bold text-green-500 flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-5 h-5" /> Delivery Completed
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <Modal open={confirmModal.open} title="Confirm status update" onClose={() => setConfirmModal({ open: false, id: null, status: null })}>
        <p className="text-gray-300 mb-4">Are you sure you want to set this delivery to <strong className="text-white">{confirmModal.status}</strong>?</p>
        <div className="flex justify-end gap-2">
          <button onClick={() => setConfirmModal({ open: false, id: null, status: null })} className="btn-outline py-2 px-4">Cancel</button>
          <button onClick={() => updateStatus(confirmModal.id, confirmModal.status)} className="btn-primary py-2 px-4">Confirm</button>
        </div>
      </Modal>
      <MapViewer open={viewer.open} onClose={() => setViewer({ open: false, delivery: null })} initial={viewer.delivery ? { lat: viewer.delivery.lat, lng: viewer.delivery.lng, address: viewer.delivery.delivery_address || viewer.delivery.order?.user?.address } : null} />
    </div>
  );
}
