import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { MapPin, Phone, Truck, CheckCircle2, RotateCcw, Banknote, CreditCard, Wallet, Coins } from 'lucide-react';
import MapViewer from '../../components/MapViewer';
import toast from 'react-hot-toast';
import Modal from '../../components/Modal';
import VerificationBanner, { VerifiedBadge } from '../../components/VerificationBanner';
import { ShieldCheck } from 'lucide-react';


export default function Deliveries() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState({});
  const [confirmModal, setConfirmModal] = useState({ open: false, id: null, status: null, delivery: null });
  const [codModal, setCodModal] = useState({ open: false, delivery: null });
  const [viewer, setViewer] = useState({ open: false, delivery: null });

  const [verification, setVerification] = useState(null);
  const [verifyLoading, setVerifyLoading] = useState(true);

  useEffect(() => { 
    fetchDeliveries(); 
    fetchVerification();
  }, []);

  const fetchVerification = async () => {
    setVerifyLoading(true);
    try {
      const { data } = await api.get('/verification/rider-status');
      setVerification(data.data);
    } catch { /* ignore */ } finally {
      setVerifyLoading(false);
    }
  };

  const fetchDeliveries = async () => {
    try {
      const { data } = await api.get('/rider/deliveries');
      setDeliveries(data.data);
    } catch (e) {
      toast.error('Failed to load deliveries');
    } finally {
      setLoading(false);
    }
  };

  const requestUpdate = (delivery, status) => {
    // COD + delivered = special cash collection modal
    if (status === 'delivered' && delivery.order?.payment_method === 'cod') {
      setCodModal({ open: true, delivery });
      return;
    }
    setConfirmModal({ open: true, id: delivery.id, status, delivery });
  };

  const updateStatus = async (id, status) => {
    try {
      setUpdating(s => ({ ...s, [id]: true }));
      await api.put(`/rider/deliveries/${id}/status`, { status });
      toast.success(status === 'delivered' ? 'Delivery completed!' : 'Status updated');
      await fetchDeliveries();
    } catch (e) {
      const msg = e?.response?.data?.message || 'Failed to update status';
      toast.error(msg);
    } finally {
      setUpdating(s => ({ ...s, [id]: false }));
      setConfirmModal({ open: false, id: null, status: null, delivery: null });
      setCodModal({ open: false, delivery: null });
    }
  };

  const paymentIcon = (method) => {
    if (method === 'gcash') return <Wallet className="w-3.5 h-3.5" />;
    if (method === 'card') return <CreditCard className="w-3.5 h-3.5" />;
    return <Banknote className="w-3.5 h-3.5" />;
  };

  const paymentLabel = (method) => {
    if (method === 'gcash') return 'GCash';
    if (method === 'card') return 'Card';
    return 'COD';
  };

  const isVerified  = verification?.verification_status === 'verified';
  const vStatus     = verification?.verification_status || 'unverified';
  const isBlocked   = !isVerified;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-serif text-white flex items-center gap-3">
            My Deliveries
            {isVerified && <VerifiedBadge kind="rider" size="md" />}
          </h1>
          <p className="text-gray-400">View and update your assigned routes</p>
        </div>
      </div>

      {!verifyLoading && (
        <VerificationBanner
          status={vStatus}
          kind="rider"
          docUrl={verification?.license_document_url}
          reason={verification?.verification_rejection_reason}
          onUploaded={fetchVerification}
        />
      )}

      {isBlocked ? (
        <div className="glass-card p-10 text-center border border-yellow-500/20 mb-8">
          <ShieldCheck className="w-14 h-14 mx-auto mb-4 text-primary-400 opacity-60" />
          <h2 className="text-xl font-serif text-white mb-2">Account Verification Required</h2>
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            Your rider account needs to be verified before you can manage deliveries.
            Please upload your <strong className="text-white">Driving License</strong> above to start the verification process.
          </p>
        </div>
      ) : (
        <>
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
              {/* Header */}
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

                {/* Payment info row */}
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    {paymentIcon(delivery.order?.payment_method)}
                    <span>{paymentLabel(delivery.order?.payment_method)}</span>
                    {delivery.order?.payment_method === 'cod' && (
                      <span className="font-bold text-primary-400">• ₱{Number(delivery.order?.total).toLocaleString()}</span>
                    )}
                  </div>
                  {/* Payment status badge */}
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                    delivery.order?.payment_status === 'paid' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-orange-500/20 text-orange-400'
                  }`}>
                    {delivery.order?.payment_status === 'paid' ? '✓ Paid' : 
                     delivery.order?.payment_method === 'cod' ? 'Collect Cash' : 'Pending'}
                  </span>
                </div>

                <p className="text-xs text-gray-500 mt-1">Assigned: {new Date(delivery.created_at).toLocaleDateString()}</p>
              </div>

              {/* Body */}
              <div className="p-5 flex-1 space-y-4">
                <div>
                  <h4 className="text-xs font-semibold text-primary-400 uppercase tracking-wider mb-2">Customer</h4>
                  <p className="font-medium text-white">{delivery.order?.user?.name}</p>
                  <p className="text-sm text-gray-400 flex items-center gap-2 mt-1">
                    <Phone className="w-3 h-3" />
                    {(delivery.recipient_phone || delivery.order?.user?.phone) ? (
                      <>
                        <a className="hover:underline" href={`tel:${delivery.recipient_phone || delivery.order.user.phone}`}>
                          {delivery.recipient_phone || delivery.order.user.phone}
                        </a>
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

              {/* Action Buttons */}
              <div className="p-5 pt-0 mt-auto grid grid-cols-2 gap-3">
                {delivery.status === 'assigned' && (
                  <button disabled={!!updating[delivery.id]} onClick={() => requestUpdate(delivery, 'picked_up')} className="btn-primary py-2 w-full col-span-2">
                    {updating[delivery.id] ? 'Updating...' : <><Truck className="w-4 h-4 mr-2" /> Pick Up</>}
                  </button>
                )}

                {delivery.status === 'picked_up' && (
                  <button disabled={!!updating[delivery.id]} onClick={() => requestUpdate(delivery, 'out_for_delivery')} className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 rounded-lg transition text-xs flex items-center justify-center col-span-2">
                    {updating[delivery.id] ? 'Updating...' : <><Truck className="w-4 h-4 mr-1" /> Out for Delivery</>}
                  </button>
                )}

                {delivery.status === 'out_for_delivery' && (
                  <>
                    <button disabled={!!updating[delivery.id]} onClick={() => requestUpdate(delivery, 'picked_up')} className="btn-outline py-2 w-full text-xs">
                      <RotateCcw className="w-3 h-3 mr-1" /> Revert
                    </button>
                    <button disabled={!!updating[delivery.id]} onClick={() => requestUpdate(delivery, 'delivered')} className="bg-green-600 hover:bg-green-500 text-white font-medium py-2 rounded-lg transition text-xs flex items-center justify-center">
                      {updating[delivery.id] ? 'Updating...' : <><CheckCircle2 className="w-4 h-4 mr-1" /> Complete</>}
                    </button>
                  </>
                )}

                {delivery.status === 'delivered' && (
                  <div className="col-span-2 text-center text-sm font-bold text-green-500 flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-5 h-5" /> 
                    {delivery.order?.payment_method === 'cod' ? 'Delivered & Cash Collected' : 'Delivery Completed'}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Generic confirm modal */}
      <Modal open={confirmModal.open} title="Confirm status update" onClose={() => setConfirmModal({ open: false, id: null, status: null, delivery: null })}>
        <p className="text-gray-300 mb-4">Are you sure you want to set this delivery to <strong className="text-white">{confirmModal.status?.replace(/_/g, ' ')}</strong>?</p>
        <div className="flex justify-end gap-2">
          <button onClick={() => setConfirmModal({ open: false, id: null, status: null, delivery: null })} className="btn-outline py-2 px-4">Cancel</button>
          <button onClick={() => updateStatus(confirmModal.id, confirmModal.status)} className="btn-primary py-2 px-4">Confirm</button>
        </div>
      </Modal>

      {/* COD Cash Collection Modal */}
      <Modal open={codModal.open} title="Collect Cash Payment" onClose={() => { if (!updating[codModal.delivery?.id]) setCodModal({ open: false, delivery: null }); }}>
        <div className="flex flex-col items-center py-4">
          <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mb-4">
            <Coins className="w-8 h-8 text-primary-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Collect Cash from Buyer</h3>
          <p className="text-gray-400 text-sm text-center mb-4">
            Please confirm you have received cash payment from the customer before marking as delivered.
          </p>
          <div className="bg-navy-950 border border-white/10 rounded-xl p-5 w-full text-center mb-6">
            <p className="text-sm text-gray-400 mb-1">Order #{codModal.delivery?.order?.order_number}</p>
            <p className="text-3xl font-bold text-primary-400">₱{Number(codModal.delivery?.order?.total || 0).toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">Cash on Delivery</p>
          </div>
          <div className="flex gap-3 w-full">
            <button 
              disabled={!!updating[codModal.delivery?.id]} 
              onClick={() => setCodModal({ open: false, delivery: null })} 
              className="btn-outline flex-1 py-3">
              Not Yet
            </button>
            <button 
              disabled={!!updating[codModal.delivery?.id]}
              onClick={() => updateStatus(codModal.delivery?.id, 'delivered')} 
              className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg flex-1 flex items-center justify-center gap-2 transition">
              {updating[codModal.delivery?.id] ? 'Processing...' : <><CheckCircle2 className="w-5 h-5" /> Cash Collected</>}
            </button>
          </div>
        </div>
      </Modal>

      <MapViewer 
        open={viewer.open} 
        onClose={() => setViewer({ open: false, delivery: null })} 
        initial={viewer.delivery ? { 
          lat: viewer.delivery.lat, 
          lng: viewer.delivery.lng, 
          address: viewer.delivery.delivery_address || viewer.delivery.order?.user?.address 
        } : null} 
      />
        </>
      )}
    </div>
  );
}
