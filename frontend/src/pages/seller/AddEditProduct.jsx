import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Save, ArrowLeft, Upload, X, ImageIcon, Star } from 'lucide-react';

export default function AddEditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  const fileInputRef = useRef();

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);

  // Existing images from server (when editing)
  const [existingImages, setExistingImages] = useState([]);
  // New files selected by the user (not yet uploaded)
  const [newFiles, setNewFiles] = useState([]);
  // Preview URLs for new files
  const [previews, setPreviews] = useState([]);

  const [formData, setFormData] = useState({
    name: '', brand_id: '', category_id: '', description: '',
    scent_notes: '', volume_ml: '', price: '', original_price: '',
    stock: '', is_active: 1, gender: 'unisex', low_stock_threshold: 5
  });

  useEffect(() => {
    Promise.all([api.get('/brands'), api.get('/categories')]).then(([bRes, cRes]) => {
      const brandData  = bRes.data?.data  ?? (Array.isArray(bRes.data)  ? bRes.data  : []);
      const catData    = cRes.data?.data  ?? (Array.isArray(cRes.data)  ? cRes.data  : []);
      setBrands(brandData);
      setCategories(catData);
      if (brandData.length > 0 && !formData.brand_id)    setFormData(p => ({...p, brand_id: brandData[0].id}));
      if (catData.length  > 0 && !formData.category_id) setFormData(p => ({...p, category_id: catData[0].id}));
    }).catch(() => toast.error('Failed to load form data'));

    if (isEditing) {
      api.get(`/products/${id}`).then(({ data }) => {
        const prod = data.data;
        setFormData({
          name:               prod.name,
          brand_id:           prod.brand?.id || '',
          category_id:        prod.category?.id || '',
          description:        prod.description,
          scent_notes:        prod.scent_notes || '',
          volume_ml:          prod.volume_ml || '',
          price:              prod.price,
          original_price:     prod.original_price || '',
          stock:              prod.stock,
          is_active:          prod.is_active ? 1 : 0,
          gender:             prod.gender || 'unisex',
          low_stock_threshold: prod.low_stock_threshold || 5,
        });
        setExistingImages(prod.images || []);
      }).catch(() => {
        toast.error('Product not found');
        navigate('/seller/products');
      }).finally(() => setFetching(false));
    }
  }, [id, isEditing]);

  // Build preview URLs when new files change
  useEffect(() => {
    const urls = newFiles.map(f => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach(u => URL.revokeObjectURL(u));
  }, [newFiles]);

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files || []);
    const valid = selected.filter(f => {
      if (f.size > 4 * 1024 * 1024) { toast.error(`${f.name} exceeds 4MB limit`); return false; }
      return true;
    });
    setNewFiles(prev => [...prev, ...valid]);
    e.target.value = '';
  };

  const removeNewFile = (idx) => {
    setNewFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const deleteExistingImage = async (imgId) => {
    if (!window.confirm('Remove this image?')) return;
    try {
      await api.delete(`/product-images/${imgId}`);
      setExistingImages(prev => {
        const next = prev.filter(img => img.id !== imgId);
        // If we deleted the primary image, and there are remaining images, 
        // the backend auto-assigns the first one. Let's mirror that locally or just refetch.
        // For simplicity, we just mark the first remaining one as primary if none are left.
        if (next.length > 0 && !next.some(img => img.is_primary)) {
          next[0].is_primary = true;
        }
        return next;
      });
      toast.success('Image removed');
    } catch {
      toast.error('Failed to remove image');
    }
  };

  const setPrimaryExistingImage = async (imgId) => {
    try {
      await api.put(`/product-images/${imgId}/set-primary`);
      setExistingImages(prev => prev.map(img => ({
        ...img,
        is_primary: img.id === imgId
      })));
      toast.success('Primary image updated');
    } catch {
      toast.error('Failed to update primary image');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      // Append text fields
      Object.entries(formData).forEach(([k, v]) => { if (v !== '' && v !== null) fd.append(k, v); });
      // Append new image files
      newFiles.forEach(f => fd.append('images[]', f));

      if (isEditing) {
        // Laravel doesn't support multipart PUT — use POST with _method spoofing
        fd.append('_method', 'PUT');
        await api.post(`/products/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Product updated successfully');
      } else {
        await api.post('/products', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Product created successfully');
      }
      navigate('/seller/products');
    } catch (err) {
      const resp = err.response?.data;
      if (resp?.errors) {
        Object.values(resp.errors).flat().forEach(msg => toast.error(msg));
      } else {
        toast.error(resp?.message || 'Error saving product');
      }
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-400">Loading product...</p>
      </div>
    </div>
  );

  const field = (label, child) => (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
      {child}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition">
        <ArrowLeft className="w-4 h-4" /> Back to Products
      </button>

      <h1 className="text-3xl font-serif text-white mb-8">
        {isEditing ? 'Edit Product' : 'Add New Fragrance'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* ── Image Manager ─────────────────────────────────────── */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-primary-400" /> Product Images
          </h2>

          {/* Existing images */}
          {existingImages.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Current Images</p>
              <div className="flex flex-wrap gap-3">
                {existingImages.map((img, idx) => (
                  <div key={img.id} className="relative group">
                    <div className="w-24 h-32 rounded-lg overflow-hidden border border-white/10 bg-navy-950">
                      <img
                        src={img.image_url}
                        alt={`Product image ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {img.is_primary ? (
                      <div className="absolute top-1 left-1 bg-primary-500/90 rounded px-1 py-0.5 flex items-center gap-1 shadow-lg">
                        <Star className="w-2.5 h-2.5 text-white" />
                        <span className="text-[9px] text-white font-bold">Primary</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setPrimaryExistingImage(img.id)}
                        title="Set as Primary"
                        className="absolute top-1 left-1 bg-navy-900/90 hover:bg-primary-500 rounded px-1.5 py-1 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                      >
                        <Star className="w-3 h-3 text-white" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => deleteExistingImage(img.id)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-400 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New file previews */}
          {previews.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">New Images (not saved yet)</p>
              <div className="flex flex-wrap gap-3">
                {previews.map((url, idx) => (
                  <div key={idx} className="relative group">
                    <div className="w-24 h-32 rounded-lg overflow-hidden border-2 border-primary-500/50 bg-navy-950">
                      <img src={url} alt={`New image ${idx + 1}`} className="w-full h-full object-cover" />
                    </div>
                    {existingImages.length === 0 && idx === 0 && (
                      <div className="absolute top-1 left-1 bg-primary-500/90 rounded px-1 py-0.5 flex items-center gap-1">
                        <Star className="w-2.5 h-2.5 text-white" />
                        <span className="text-[9px] text-white font-bold">Primary</span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeNewFile(idx)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-400 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Drop zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-white/10 hover:border-primary-500/50 rounded-xl p-8 text-center cursor-pointer transition-colors group"
          >
            <Upload className="w-8 h-8 text-gray-500 group-hover:text-primary-400 mx-auto mb-3 transition-colors" />
            <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
              Click to upload images <span className="text-primary-400">(JPEG, PNG, WebP – max 4MB each)</span>
            </p>
            <p className="text-xs text-gray-600 mt-1">First image becomes the primary display image</p>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/jpeg,image/png,image/jpg,image/webp"
              multiple
              onChange={handleFileChange}
            />
          </div>
        </div>

        {/* ── Product Details ────────────────────────────────────── */}
        <div className="glass-card p-6 sm:p-8 space-y-6">
          <h2 className="text-lg font-medium text-white">Product Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              {field('Product Name',
                <input type="text" required className="input-field" value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})} />
              )}
            </div>

            {field('Brand',
              <select required className="input-field" value={formData.brand_id}
                onChange={e => setFormData({...formData, brand_id: e.target.value})}>
                <option value="">Select Brand</option>
                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            )}

            {field('Scent Category',
              <select required className="input-field" value={formData.category_id}
                onChange={e => setFormData({...formData, category_id: e.target.value})}>
                <option value="">Select Category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}

            {field('Gender',
              <select required className="input-field" value={formData.gender}
                onChange={e => setFormData({...formData, gender: e.target.value})}>
                <option value="unisex">Unisex</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            )}

            {field('Volume / Size (e.g. 100ml Eau de Parfum)',
              <input type="text" required className="input-field" placeholder="100ml Eau de Parfum"
                value={formData.volume_ml} onChange={e => setFormData({...formData, volume_ml: e.target.value})} />
            )}

            {field('Price (₱)',
              <input type="number" step="0.01" required min="0" className="input-field"
                value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
            )}

            {field('Original Price (₱) — optional, shows as crossed-out',
              <input type="number" step="0.01" min="0" className="input-field" placeholder="Leave blank if no discount"
                value={formData.original_price} onChange={e => setFormData({...formData, original_price: e.target.value})} />
            )}

            {field('Stock Quantity',
              <input type="number" required min="0" className="input-field"
                value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} />
            )}

            {field('Low Stock Alert Threshold',
              <input type="number" min="1" className="input-field"
                value={formData.low_stock_threshold} onChange={e => setFormData({...formData, low_stock_threshold: e.target.value})} />
            )}

            {field('Status',
              <select className="input-field" value={formData.is_active}
                onChange={e => setFormData({...formData, is_active: Number(e.target.value)})}>
                <option value={1}>Active — Visible to customers</option>
                <option value={0}>Draft — Hidden from shop</option>
              </select>
            )}

            <div className="md:col-span-2">
              {field('Scent Notes (comma separated)',
                <input type="text" className="input-field" placeholder="Bergamot, Vanilla, Sandalwood, Musk"
                  value={formData.scent_notes} onChange={e => setFormData({...formData, scent_notes: e.target.value})} />
              )}
            </div>

            <div className="md:col-span-2">
              {field('Description',
                <textarea required className="input-field min-h-[150px]"
                  value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              )}
            </div>
          </div>
        </div>

        {/* ── Actions ───────────────────────────────────────────── */}
        <div className="flex justify-end gap-4">
          <button type="button" onClick={() => navigate(-1)} className="btn-outline border-white/10 text-gray-300 hover:text-white px-6 py-3">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn-primary py-3 px-8 flex items-center gap-2">
            {loading
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
              : <><Save className="w-5 h-5" /> {isEditing ? 'Update Product' : 'Create Product'}</>
            }
          </button>
        </div>
      </form>
    </div>
  );
}
