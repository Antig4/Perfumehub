import { Truck, RefreshCw, ShieldCheck, Clock } from 'lucide-react';

const Section = ({ icon: Icon, color, title, children }) => (
  <div className="glass-card p-6">
    <div className={`flex items-center gap-3 mb-4`}>
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <h2 className="text-xl font-serif text-white">{title}</h2>
    </div>
    <div className="text-gray-400 text-sm space-y-2 leading-relaxed">{children}</div>
  </div>
);

export default function ShippingReturns() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-20">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-serif text-white mb-3">Shipping & Returns</h1>
        <p className="text-gray-400">Everything you need to know about how we deliver and handle returns.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <Section icon={Truck} color="bg-primary-500/20" title="Shipping Policy">
          <p>We ship nationwide across the Philippines. All orders are processed within <strong className="text-white">1–2 business days</strong> of payment confirmation.</p>
          <p>Standard delivery takes <strong className="text-white">3–5 business days</strong>. Remote areas may take an additional 1–2 days.</p>
          <p>Shipping fees are calculated at checkout based on your location.</p>
        </Section>

        <Section icon={Clock} color="bg-blue-500/20" title="Delivery Times">
          <ul className="space-y-2">
            {[['Metro Manila', '2–3 days'], ['Luzon', '3–4 days'], ['Visayas', '4–5 days'], ['Mindanao', '5–7 days']].map(([region, time]) => (
              <li key={region} className="flex justify-between border-b border-white/5 pb-1">
                <span>{region}</span>
                <span className="text-white font-medium">{time}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section icon={RefreshCw} color="bg-green-500/20" title="Returns Policy">
          <p>We accept returns within <strong className="text-white">7 days</strong> of delivery for:</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Damaged or defective items</li>
            <li>Wrong item delivered</li>
            <li>Item significantly different from description</li>
          </ul>
          <p className="mt-3">To initiate a return, contact us at <span className="text-primary-400">perfumehub@gmail.com</span> with your order number and photos of the issue.</p>
        </Section>

        <Section icon={ShieldCheck} color="bg-purple-500/20" title="Authenticity Guarantee">
          <p>Every product on PerfumeHub is <strong className="text-white">100% authentic</strong>. Our sellers are verified and their products are authenticated before listing.</p>
          <p className="mt-2">If you receive a product you suspect is inauthentic, please contact us immediately. We will investigate and provide a full refund if confirmed.</p>
        </Section>
      </div>
    </div>
  );
}
