import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-navy-950 border-t border-white/5 pt-16 pb-8 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          
          <div className="space-y-4">
            <Link to="/" className="inline-block">
              <span className="font-serif text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-400 to-primary-600">
                PerfumeHub
              </span>
            </Link>
            <p className="text-sm leading-relaxed">
              Your ultimate destination for authentic, luxury, and designer fragrances. Discover the scent that defines you.
            </p>
            <div className="flex gap-4 pt-2">
              <a href="https://www.facebook.com/echoyabrea" className="hover:text-primary-400 transition-colors"><Facebook className="w-5 h-5" /></a>
              <a href="#" className="hover:text-primary-400 transition-colors"><Twitter className="w-5 h-5" /></a>
              <a href="https://www.instagram.com/krk_jndr/" className="hover:text-primary-400 transition-colors"><Instagram className="w-5 h-5" /></a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-serif text-lg mb-6">Explore</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/catalog" className="hover:text-primary-400 transition-colors">Shop All</Link></li>
              <li><Link to="/brands" className="hover:text-primary-400 transition-colors">Our Brands</Link></li>
              <li><Link to="/trending" className="hover:text-primary-400 transition-colors">Trending Now</Link></li>
              <li><Link to="/best-sellers" className="hover:text-primary-400 transition-colors">Best Sellers</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-serif text-lg mb-6">Customer Care</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/track-order" className="hover:text-primary-400 transition-colors">Track Your Order</Link></li>
              <li><Link to="/faq" className="hover:text-primary-400 transition-colors">FAQ</Link></li>
              <li><Link to="/shipping" className="hover:text-primary-400 transition-colors">Shipping & Returns</Link></li>
              <li><Link to="/contact" className="hover:text-primary-400 transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-serif text-lg mb-6">Contact</h4>
            <ul className="space-y-4 text-sm">
              <li className="flex gap-3">
                <MapPin className="w-5 h-5 text-primary-500 shrink-0" />
                <span>Maon, Butuan City, Agusan Del Norte</span>
              </li>
              <li className="flex gap-3">
                <Phone className="w-5 h-5 text-primary-500 shrink-0" />
                <span>+63 9 851 878 902</span>
              </li>
              <li className="flex gap-3">
                <Mail className="w-5 h-5 text-primary-500 shrink-0" />
                <span>perfumehub18@gmail.com</span>
              </li>
            </ul>
          </div>

        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
          <p>&copy; {new Date().getFullYear()} PerfumeHub. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
