import { getDashboardStats, getProducts, getTopProducts } from '@/lib/data';
import { Product } from '@/lib/types';
import { cn } from '@/lib/utils';

export default async function AdminDashboardPage() {
  const [stats, allProducts, topProducts] = await Promise.all([
    getDashboardStats(),
    getProducts(),
    getTopProducts(5),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview of your store performance</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-primary-100">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-green-100">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Products</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-blue-100">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Categories</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCategories}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-purple-100">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Collections</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCollections}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Second row: Revenue and Pending */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-blue-100">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                ${stats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-yellow-100">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending Orders</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingOrders}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-red-100">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Low Stock Products</p>
              <p className="text-2xl font-bold text-gray-900">{stats.lowStockProducts}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Order Status & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Status */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Status</h2>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(stats.orderStatusCounts)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([status, count]) => {
                const orderStatus = status as 'PENDING' | 'PROCESSING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
                const statusColors: Record<string, string> = {
                  PENDING: 'badge-yellow',
                  PROCESSING: 'badge-blue',
                  CONFIRMED: 'badge-gray',
                  SHIPPED: 'badge-primary',
                  DELIVERED: 'badge-green',
                  CANCELLED: 'badge-red',
                  REFUNDED: 'badge-gray',
                };
                return (
                  <div key={status} className="flex items-center justify-between py-2 border-b last:border-0">
                    <span className={`badge ${statusColors[status] || 'badge-gray'}`}>{status}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h2>
          {stats.recentOrders.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No orders yet</p>
          ) : (
            <div className="space-y-3">
              {stats.recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{order.orderNumber}</p>
                    <p className="text-xs text-gray-500">{order.user?.email || order.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      ${order.total.toFixed(2)}
                    </p>
                    <span className={`badge ${
                      order.status === 'DELIVERED' ? 'badge-green' :
                      order.status === 'SHIPPED' ? 'badge-primary' :
                      order.status === 'PROCESSING' ? 'badge-blue' :
                      order.status === 'CANCELLED' ? 'badge-red' :
                      'badge-yellow'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Low Stock Alert */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Low Stock Products (&lt; 30 units)</h2>
        {(() => {
          const lowStock = allProducts.filter(p => p.inventory < 30).sort((a, b) => a.inventory - b.inventory);
          if (lowStock.length === 0) {
            return (
              <div className="alert-success">
                All products are well-stocked!
              </div>
            );
          }
          return (
            <div className="table-container overflow-x-auto">
              <table className="table">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell">Product</th>
                    <th className="table-header-cell">SKU</th>
                    <th className="table-header-cell">Stock</th>
                    <th className="table-header-cell">Price</th>
                    <th className="table-header-cell">Category</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStock.map((product) => (
                    <tr key={product.id} className="table-row">
                      <td className="table-cell font-medium">{product.name}</td>
                      <td className="table-cell font-mono text-sm text-gray-600">{product.sku || '-'}</td>
                      <td className="table-cell">
                        <span className={`badge ${product.inventory < 10 ? 'badge-red' : 'badge-yellow'}`}>
                          {product.inventory} left
                        </span>
                      </td>
                      <td className="table-cell">${product.price.toFixed(2)}</td>
                      <td className="table-cell text-sm text-gray-600">{product.categoryId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })()}
      </div>

      {/* Top Products */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Products (Best Sellers)</h2>
        {(() => {
          if (topProducts.length === 0) {
            return (
              <div className="text-gray-500 text-center py-4">
                No sales data yet. Orders will populate this section.
              </div>
            );
          }
          return (
            <div className="table-container overflow-x-auto">
              <table className="table">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell">Product</th>
                    <th className="table-header-cell">SKU</th>
                    <th className="table-header-cell">Sales</th>
                    <th className="table-header-cell">Revenue</th>
                    <th className="table-header-cell">Stock</th>
                    <th className="table-header-cell">Category</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map(({ product, totalSales, totalRevenue }, index) => (
                    <tr key={product.id} className="table-row">
                      <td className="table-cell">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-bold text-gray-400 w-6">#{index + 1}</span>
                          {product.images?.[0]?.url ? (
                            <img
                              src={product.images[0].url}
                              alt={product.name}
                              className="w-10 h-10 object-cover rounded"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/40?text=No+Image';
                              }}
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                              <span className="text-gray-400 text-xs">No img</span>
                            </div>
                          )}
                          <span className="font-medium text-gray-900">{product.name}</span>
                        </div>
                      </td>
                      <td className="table-cell font-mono text-sm text-gray-600">
                        {product.sku || '-'}
                      </td>
                      <td className="table-cell">
                        <span className="badge badge-primary">{totalSales} sold</span>
                      </td>
                      <td className="table-cell font-medium text-green-600">
                        ${totalRevenue.toFixed(2)}
                      </td>
                      <td className="table-cell">
                        <span className={cn(
                          'badge',
                          product.inventory < 10 ? 'badge-red' :
                          product.inventory < 30 ? 'badge-yellow' : 'badge-green'
                        )}>
                          {product.inventory} left
                        </span>
                      </td>
                      <td className="table-cell text-sm text-gray-600">{product.categoryId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
