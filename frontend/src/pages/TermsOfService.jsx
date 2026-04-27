import { FileText } from 'lucide-react';

const P = ({ children }) => <p className="text-gray-400 text-sm leading-relaxed">{children}</p>;
const H = ({ children }) => <h2 className="text-lg font-serif text-white mt-8 mb-2">{children}</h2>;

export default function TermsOfService() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20">
      <div className="text-center mb-10">
        <FileText className="w-12 h-12 mx-auto text-primary-400 mb-4" />
        <h1 className="text-4xl font-serif text-white mb-2">Terms of Service</h1>
        <p className="text-gray-500 text-sm">Last updated: April 2025</p>
      </div>
      <div className="glass-card p-8 space-y-1">
        <P>By accessing or using PerfumeHub, you agree to be bound by these Terms of Service. Please read them carefully.</P>
        <H>1. Use of Service</H>
        <P>PerfumeHub is an e-commerce platform for buying and selling authentic fragrances. You must be at least 18 years old to use this service. You are responsible for maintaining the confidentiality of your account credentials.</P>
        <H>2. Seller Obligations</H>
        <P>Sellers must only list authentic products, provide accurate descriptions, and fulfill orders promptly. Fraudulent listings or misrepresentation will result in immediate account suspension.</P>
        <H>3. Buyer Obligations</H>
        <P>Buyers agree to pay for orders placed and provide accurate delivery information. Misuse of the returns or dispute system may result in account restrictions.</P>
        <H>4. Prohibited Activities</H>
        <P>You may not: post fake reviews, engage in price manipulation, attempt to hack or exploit the platform, or use PerfumeHub for any illegal activity.</P>
        <H>5. Payment & Refunds</H>
        <P>Payments are processed securely. Refunds are issued for eligible returns as described in our Shipping & Returns policy. We reserve the right to hold payments for fraud investigation.</P>
        <H>6. Intellectual Property</H>
        <P>All content on PerfumeHub — including logos, designs, and text — is owned by or licensed to PerfumeHub. Unauthorized reproduction is prohibited.</P>
        <H>7. Limitation of Liability</H>
        <P>PerfumeHub is not liable for any indirect, incidental, or consequential damages arising from the use of our platform. Our total liability shall not exceed the amount paid for the order in question.</P>
        <H>8. Termination</H>
        <P>We reserve the right to suspend or terminate accounts that violate these terms, at our sole discretion and without prior notice.</P>
        <H>9. Changes to Terms</H>
        <P>We may revise these terms at any time. Continued use of the platform after changes constitutes your acceptance of the new terms.</P>
        <H>10. Contact</H>
        <P>For questions about these terms, contact us at perfumehub@gmail.com.</P>
      </div>
    </div>
  );
}
