import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { Download, Calendar, BarChart3, TrendingUp, TrendingDown, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminReports() {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [months, setMonths] = useState(12);

  useEffect(() => { fetchReports(); }, [months]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/reports/sales', { params: { months } });
      setReportData(res.data);
    } catch (e) {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      const token = localStorage.getItem('token');
      // Create a direct download link using token authentication
      const url = `http://localhost:8000/api/admin/reports/export-csv?months=${months}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `orders_report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
      
      toast.success('Report exported successfully');
    } catch (e) {
      toast.error('Failed to export CSV report');
    }
  };

  if (loading && !reportData) return <div className="p-12 text-center text-gray-400">Loading reports...</div>;

  const totalRevenue = reportData?.sales?.reduce((sum, item) => sum + Number(item.revenue), 0) || 0;
  const totalOrders = reportData?.sales?.reduce((sum, item) => sum + Number(item.orders), 0) || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-6 flex items-center gap-4">
        <Link to="/admin/dashboard" className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-serif text-white">Platform Reports</h1>
          <p className="text-gray-400 mt-1">Detailed analytics and exports</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-8 bg-navy-950 border border-white/5 p-4 rounded-xl">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-gray-400" />
          <span className="text-sm font-medium text-white">Timeframe:</span>
          <select 
            value={months} 
            onChange={e => setMonths(Number(e.target.value))}
            className="bg-navy-900 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-primary-500"
          >
            <option value={3}>Last 3 Months</option>
            <option value={6}>Last 6 Months</option>
            <option value={12}>Last 12 Months</option>
            <option value={24}>Last 24 Months</option>
          </select>
        </div>
        
        <button 
          onClick={handleExportCsv}
          className="btn-primary py-2 px-5 text-sm flex items-center gap-2"
        >
          <Download className="w-4 h-4" /> Export Orders to CSV
        </button>
      </div>

      {loading && reportData && (
        <div className="text-primary-400 text-sm mb-4 animate-pulse flex justify-end">Refreshing data...</div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="glass-card p-6 flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm font-medium mb-1">Total Revenue ({months} mo)</p>
            <p className="text-3xl font-bold text-white">₱{totalRevenue.toLocaleString()}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-primary-500/20 flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-primary-400" />
          </div>
        </div>
        <div className="glass-card p-6 flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm font-medium mb-1">Total Orders ({months} mo)</p>
            <p className="text-3xl font-bold text-white">{totalOrders.toLocaleString()}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-blue-400" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Sellers Table */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-medium text-white mb-6">Top Performing Sellers</h2>
          {reportData?.topSellers?.length === 0 ? (
             <p className="text-gray-500 text-sm text-center py-6">No seller data.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-gray-400">
                    <th className="pb-3 font-medium">Rank</th>
                    <th className="pb-3 font-medium">Store</th>
                    <th className="pb-3 font-medium text-right">Revenue Generated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {reportData?.topSellers?.map((seller, i) => (
                    <tr key={i} className="group hover:bg-white/5 transition">
                      <td className="py-3 text-white font-medium">#{i + 1}</td>
                      <td className="py-3">
                        <p className="text-white font-medium">{seller.store_name}</p>
                        <p className="text-xs text-gray-500">{seller.name}</p>
                      </td>
                      <td className="py-3 text-right text-primary-400 font-bold">
                        ₱{Number(seller.revenue).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top Products Table */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-medium text-white mb-6">Best Selling Products</h2>
          {reportData?.topProducts?.length === 0 ? (
             <p className="text-gray-500 text-sm text-center py-6">No product data.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-gray-400">
                    <th className="pb-3 font-medium">Product</th>
                    <th className="pb-3 font-medium text-right">Price</th>
                    <th className="pb-3 font-medium text-right">Units Sold</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {reportData?.topProducts?.map((product, i) => (
                    <tr key={product.id} className="group hover:bg-white/5 transition">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <span className="text-gray-500 text-xs w-4">{i + 1}</span>
                          <p className="text-white font-medium">{product.name}</p>
                        </div>
                      </td>
                      <td className="py-3 text-right text-gray-400">
                        ₱{Number(product.price).toLocaleString()}
                      </td>
                      <td className="py-3 text-right">
                        <span className="bg-primary-500/20 text-primary-400 px-2 py-1 rounded font-bold">
                          {product.sales_count}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
