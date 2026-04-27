import { Shield } from 'lucide-react';

const P = ({ children }) => <p className="text-gray-400 text-sm leading-relaxed">{children}</p>;
const H = ({ children }) => <h2 className="text-lg font-serif text-white mt-8 mb-2">{children}</h2>;

export default function PrivacyPolicy() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20">
      <div className="text-center mb-10">
        <Shield className="w-12 h-12 mx-auto text-primary-400 mb-4" />
        <h1 className="text-4xl font-serif text-white mb-2">Privacy Policy</h1>
        <p className="text-gray-500 text-sm">Last updated: April 2025</p>
      </div>
      <div className="glass-card p-8 space-y-1">
        <P>PerfumeHub ("we", "us", or "our") is committed to protecting your personal information and your right to privacy.</P>
        <H>1. Information We Collect</H>
        <P>We collect information you provide directly: name, email address, phone number, delivery address, and payment details. We also collect usage data such as pages visited, products viewed, and purchase history.</P>
        <H>2. How We Use Your Information</H>
        <P>We use your information to: process orders and payments, deliver products, send order updates, improve our services, and communicate promotional offers (with your consent).</P>
        <H>3. Information Sharing</H>
        <P>We do not sell your personal data. We share data only with trusted delivery partners and payment processors required to fulfill your orders, and only what is strictly necessary.</P>
        <H>4. Data Security</H>
        <P>We use industry-standard encryption (HTTPS/TLS) to protect data in transit. Passwords are hashed and never stored in plain text. Access to personal data is restricted to authorized personnel only.</P>
        <H>5. Your Rights</H>
        <P>You have the right to access, correct, or delete your personal data. To exercise these rights, contact us at perfumehub@gmail.com.</P>
        <H>6. Cookies</H>
        <P>We use essential cookies for authentication and session management. We do not use third-party advertising cookies.</P>
        <H>7. Changes to this Policy</H>
        <P>We may update this policy from time to time. Changes will be posted on this page with an updated date. Continued use of PerfumeHub constitutes acceptance of the updated policy.</P>
        <H>8. Contact</H>
        <P>Questions about this policy? Email us at perfumehub@gmail.com or call +63 9 851 878 902.</P>
      </div>
    </div>
  );
}
