import { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

const FAQS = [
  { q: 'Are all products 100% authentic?', a: 'Yes. Every product sold on PerfumeHub is sourced directly from verified and authorized sellers. We have a strict authentication process before any seller is approved on our platform.' },
  { q: 'How long does delivery take?', a: 'Standard nationwide delivery takes 3–5 business days. You can track your order status in real time from your My Orders page.' },
  { q: 'What payment methods are accepted?', a: 'We accept Cash on Delivery (COD), GCash, and major credit/debit cards (Visa, Mastercard) via our secure payment gateway.' },
  { q: 'Can I return or exchange a product?', a: 'Yes. We have a 7-day return policy for damaged or incorrect items. Contact our support team with photos of the issue to initiate a return.' },
  { q: 'How do I write a review?', a: 'After your order status changes to "Delivered", a "Write Review" button will appear on your My Orders page for each delivered product.' },
  { q: 'Can I cancel my order?', a: 'Orders can be cancelled while they are still in "Pending" status. Once confirmed or packed, cancellations must be requested through our support team.' },
  { q: 'How do I become a seller?', a: 'Register an account and select "Seller" as your role, then complete your store profile. Your application will be reviewed by our admin team within 1–2 business days.' },
  { q: 'Is my personal information safe?', a: 'Absolutely. We use industry-standard encryption to protect your data. We never share your personal information with third parties without your consent.' },
];

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`glass-card overflow-hidden transition ${open ? 'border-primary-500/30' : ''}`}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-4 p-5 text-left"
      >
        <span className="text-white font-medium">{q}</span>
        {open ? <ChevronUp className="w-4 h-4 text-primary-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />}
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-white/5 pt-3">
          <p className="text-gray-400 text-sm leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}

export default function FAQ() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20">
      <div className="text-center mb-12">
        <HelpCircle className="w-12 h-12 mx-auto text-primary-400 mb-4" />
        <h1 className="text-4xl font-serif text-white mb-3">Frequently Asked Questions</h1>
        <p className="text-gray-400">Everything you need to know about PerfumeHub.</p>
      </div>
      <div className="space-y-3">
        {FAQS.map((faq) => <FAQItem key={faq.q} {...faq} />)}
      </div>
    </div>
  );
}
