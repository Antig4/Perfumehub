import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { Plus, Edit2, Trash2, Tag, Search } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SellerProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchProducts();
  }, [search]);

  const fetchProducts = async () => {
    try {
      const { data } = await api.get(`/products?search=${search}`);
      setProducts(data.data); // Sanctum pagination wrapper
    } catch (e) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product deleted');
      fetchProducts();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-serif text-white">My Products</h1>
          <p className="text-gray-400">Manage your fragrance catalog</p>
        </div>
        <Link to="/seller/products/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" /> Add Product
        </Link>
      </div>

      <div className="glass-card overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-white/5 flex gap-4 bg-navy-950/50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search products..." 
              className="input-field pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-navy-900/50 text-gray-400 text-sm font-medium border-b border-white/5 uppercase tracking-wider">
                <th className="p-4">Product</th>
                <th className="p-4">Price</th>
                <th className="p-4">Stock</th>
                <th className="p-4">Sales</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-400">Loading catalog...</td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-400">
                    <Tag className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    No products found. Add your first fragrance!
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-white/5 transition">
                    <td className="p-4 flex items-center gap-4">
                      <div className="w-12 h-16 bg-navy-950 rounded shrink-0 overflow-hidden">
                         <img src={product.primary_image?.image_path || 'https://via.placeholder.com/150'} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{product.name}</p>
                        <p className="text-xs text-primary-400">{product.brand?.name}</p>
                      </div>
                    </td>
                    <td className="p-4 text-white">₱{Number(product.price).toLocaleString()}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${product.stock > 10 ? 'bg-green-500/20 text-green-400' : product.stock > 0 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                        {product.stock} left
                      </span>
                    </td>
                    <td className="p-4 text-gray-300">{product.sales_count}</td>
                    <td className="p-4">
                      <span className={`text-xs font-bold uppercase ${product.is_active ? 'text-green-400' : 'text-gray-500'}`}>
                        {product.is_active ? 'Active' : 'Draft'}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                       {/* Intentionally using standard router Links - these modals logic could be adapted */}
                       <Link to={`/seller/products/${product.id}/edit`} className="inline-flex p-2 text-gray-400 hover:text-white transition bg-navy-900 rounded-md">
                         <Edit2 className="w-4 h-4" />
                       </Link>
                       <button onClick={() => handleDelete(product.id)} className="inline-flex p-2 text-gray-400 hover:text-red-400 transition bg-navy-900 rounded-md">
                         <Trash2 className="w-4 h-4" />
                       </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
