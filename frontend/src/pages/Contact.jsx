import { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import emailjs from '@emailjs/browser';
export default function Contact() {
  const [form, setForm]       = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]     = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      const templateParams = {
        name: form.name,
        email: form.email,
        subject: form.subject || 'New Contact Form Submission',
        message: form.message,
        time: new Date().toLocaleString()
      };

      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        templateParams,
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY
      );

      setSubmitted(true);
      toast.success('Message sent! We\'ll reply within 24 hours.');
    } catch (error) {
      console.error('EmailJS Error:', error);
      toast.error('Failed to send message. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-20">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-serif text-white mb-3">Contact Us</h1>
        <p className="text-gray-400">Have a question or concern? We're here to help.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-10">
        {/* Info */}
        <div className="space-y-6">
          <div className="glass-card p-6 space-y-5">
            {[
              { icon: MapPin, label: 'Address',   value: 'Maon, Butuan City, Agusan Del Norte' },
              { icon: Phone,  label: 'Phone',     value: '+63 9 851 878 902' },
              { icon: Mail,   label: 'Email',     value: 'perfumehub@gmail.com' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-lg bg-primary-500/15 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-primary-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">{label}</p>
                  <p className="text-gray-200 text-sm">{value}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="glass-card p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Business Hours</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-300"><span>Monday – Friday</span><span className="text-white font-medium">8:00 AM – 6:00 PM</span></div>
              <div className="flex justify-between text-gray-300"><span>Saturday</span><span className="text-white font-medium">9:00 AM – 3:00 PM</span></div>
              <div className="flex justify-between text-gray-500"><span>Sunday</span><span>Closed</span></div>
            </div>
          </div>
        </div>

        {/* Form */}
        {submitted ? (
          <div className="glass-card p-10 flex flex-col items-center justify-center text-center gap-4">
            <CheckCircle2 className="w-16 h-16 text-green-400" />
            <h2 className="text-2xl font-serif text-white">Message Sent!</h2>
            <p className="text-gray-400">Thank you for reaching out. We'll get back to you within 24 hours.</p>
            <button onClick={() => { setSubmitted(false); setForm({ name: '', email: '', subject: '', message: '' }); }} className="btn-outline px-6 py-2 mt-2">Send Another</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input-field w-full" placeholder="Your name" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">Email *</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="input-field w-full" placeholder="you@example.com" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">Subject</label>
              <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} className="input-field w-full" placeholder="How can we help?" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">Message *</label>
              <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} rows={5} className="input-field w-full resize-none" placeholder="Tell us more…" />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Sending…
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Send Message
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
