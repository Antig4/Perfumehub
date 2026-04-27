import { Link } from 'react-router-dom';
import { Package, MapPin, Clock, PhoneCall } from 'lucide-react';

export default function TrackOrder() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20">
      <div className="text-center mb-12">
        <Package className="w-14 h-14 mx-auto text-primary-400 mb-4" />
        <h1 className="text-4xl font-serif text-white mb-3">Track Your Order</h1>
        <p className="text-gray-400">Monitor the real-time status of your delivery right from your account.</p>
      </div>
      <div className="glass-card p-8 text-center space-y-6">
        <p className="text-gray-300 leading-relaxed">
          Your order tracking is available directly in your <strong className="text-white">My Orders</strong> dashboard. Each order shows its current status — from processing to out-for-delivery.
        </p>
        <Link to="/orders" className="btn-primary inline-flex items-center gap-2 px-8 py-3">
          <Package className="w-4 h-4" /> View My Orders
        </Link>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/5">
          {[
            { icon: MapPin,    title: 'Real-time Updates',  text: 'Track from confirmed → delivered' },
            { icon: Clock,     title: 'Delivery Timeline',  text: '3–5 business days nationwide' },
            { icon: PhoneCall, title: 'Need Help?',         text: 'Contact us at +63 9 851 878 902' },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="bg-navy-950/50 rounded-xl p-4">
              <Icon className="w-5 h-5 text-primary-400 mb-2" />
              <p className="text-white text-sm font-semibold mb-1">{title}</p>
              <p className="text-gray-500 text-xs">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
