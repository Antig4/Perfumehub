import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Save, ArrowLeft } from 'lucide-react';

export default function AddEditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  
  const [formData, setFormData] = useState({
    name: '', brand_id: '', category_id: '', description: '',
    scent_notes: '', volume_ml: '', price: '', stock: '', is_active: 1,
    gender: 'unisex'
  });

  useEffect(() => {
    // Load dependencies first. API responses sometimes wrap arrays in { data: [...] }
    Promise.all([api.get('/brands'), api.get('/categories')]).then(([bRes, cRes]) => {
      const brandData = (bRes.data && bRes.data.data) ? bRes.data.data : (Array.isArray(bRes.data) ? bRes.data : []);
      const categoryData = (cRes.data && cRes.data.data) ? cRes.data.data : (Array.isArray(cRes.data) ? cRes.data : []);
      setBrands(brandData);
      setCategories(categoryData);
      if (brandData.length > 0 && !formData.brand_id) setFormData(p => ({...p, brand_id: brandData[0].id}));
      if (categoryData.length > 0 && !formData.category_id) setFormData(p => ({...p, category_id: categoryData[0].id}));
    }).catch(() => toast.error('Failed to load categories'));

    if (isEditing) {
      api.get(`/products/${id}`).then(({ data }) => {
        const prod = data.data;
        setFormData({
          name: prod.name,
          brand_id: prod.brand?.id || '',
          category_id: prod.category?.id || '',
          description: prod.description,
          scent_notes: prod.scent_notes || '',
            volume_ml: prod.volume_ml,
          price: prod.price,
          stock: prod.stock,
            is_active: prod.is_active ? 1 : 0,
            gender: prod.gender || 'unisex'
        });
      }).catch(() => {
        toast.error('Product not found');
        navigate('/seller/products');
      }).finally(() => setFetching(false));
    }
  }, [id, isEditing]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEditing) {
        await api.put(`/products/${id}`, formData);
        toast.success('Product updated');
      } else {
        await api.post('/products', formData);
        toast.success('Product created');
      }
      navigate('/seller/products');
    } catch (e) {
      // Show validation errors from Laravel (422) if present
      const resp = e.response?.data;
      if (resp?.errors) {
        // resp.errors is an object with arrays of messages
        Object.values(resp.errors).flat().forEach(msg => toast.error(msg));
      } else {
        toast.error(resp?.message || 'Error saving product');
      }
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="p-12 text-center text-gray-400">Loading product...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Products
      </button>

      <h1 className="text-3xl font-serif text-white mb-8">{isEditing ? 'Edit Product' : 'Add New Fragrance'}</h1>

      <form onSubmit={handleSubmit} className="glass-card p-6 sm:p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-1">Product Name</label>
            <input type="text" required className="input-field" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Brand</label>
            <select required className="input-field" value={formData.brand_id} onChange={e => setFormData({...formData, brand_id: e.target.value})}>
              <option value="">Select Brand</option>
              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Scent Category</label>
            <select required className="input-field" value={formData.category_id} onChange={e => setFormData({...formData, category_id: e.target.value})}>
              <option value="">Select Category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Gender</label>
            <select required className="input-field" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
              <option value="unisex">Unisex</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Volume (e.g. 50ml, 100ml)</label>
            <input type="text" required className="input-field" placeholder="100ml Eau de Parfum" value={formData.volume_ml} onChange={e => setFormData({...formData, volume_ml: e.target.value})} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Price (₱)</label>
            <input type="number" step="0.01" required className="input-field" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Initial Stock</label>
            <input type="number" required className="input-field" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} />
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
             <select className="input-field" value={formData.is_active} onChange={e => setFormData({...formData, is_active: Number(e.target.value)})}>
                <option value={1}>Active (Visible to customers)</option>
                <option value={0}>Draft (Hidden)</option>
             </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-1">Scent Notes (comma separated)</label>
            <input type="text" className="input-field" placeholder="Bergamot, Vanilla, Sandalwood" value={formData.scent_notes} onChange={e => setFormData({...formData, scent_notes: e.target.value})} />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
            <textarea required className="input-field min-h-[150px]" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-white/10">
          <button type="button" onClick={() => navigate(-1)} className="btn-outline border-none mr-4">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary py-3 px-8">
            <Save className="w-5 h-5" /> {loading ? 'Saving...' : 'Save Product'}
          </button>
        </div>
      </form>
    </div>
  );
}
