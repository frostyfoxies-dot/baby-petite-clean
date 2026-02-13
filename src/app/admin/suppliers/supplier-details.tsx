'use client';

import { useState } from 'react';
import { ExternalLink, Star, Package, ShoppingBag, MoreVertical } from 'lucide-react';
import { DataTable, type ColumnDef } from '@/components/admin/data-table';
import { StatusBadge } from '@/components/admin/status-badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import type { Supplier } from '@prisma/client';

/**
 * Supplier with counts
 */
interface SupplierWithCounts extends Supplier {
  _count: {
    products: number;
    dropshipOrders: number;
  };
}

/**
 * Props for the SupplierDetails component
 */
export interface SupplierDetailsProps {
  suppliers: SupplierWithCounts[];
}

/**
 * SupplierDetails Component
 * 
 * Displays a table of all suppliers with filtering and actions.
 * 
 * @example
 * ```tsx
 * <SupplierDetails suppliers={suppliers} />
 * ```
 */
export function SupplierDetails({ suppliers }: SupplierDetailsProps) {
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierWithCounts | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Filter suppliers by status
  const filteredSuppliers = statusFilter === 'all'
    ? suppliers
    : suppliers.filter(s => s.status === statusFilter);

  // Column definitions
  const columns: ColumnDef<SupplierWithCounts>[] = [
    {
      id: 'name',
      header: 'Supplier',
      sortable: true,
      cell: (supplier) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
            <Package className="w-5 h-5 text-gray-500" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{supplier.name}</p>
            <p className="text-sm text-gray-500">ID: {supplier.aliExpressId}</p>
          </div>
        </div>
      ),
    },
    {
      id: 'rating',
      header: 'Rating',
      sortable: true,
      align: 'center',
      cell: (supplier) => (
        supplier.rating ? (
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <span className="font-medium">{supplier.rating.toFixed(1)}</span>
          </div>
        ) : (
          <span className="text-gray-400">N/A</span>
        )
      ),
    },
    {
      id: 'products',
      header: 'Products',
      align: 'center',
      cell: (supplier) => (
        <div className="flex items-center gap-1">
          <Package className="w-4 h-4 text-gray-400" />
          <span>{supplier._count.products}</span>
        </div>
      ),
    },
    {
      id: 'totalOrders',
      header: 'Orders',
      sortable: true,
      align: 'center',
      cell: (supplier) => (
        <div className="flex items-center gap-1">
          <ShoppingBag className="w-4 h-4 text-gray-400" />
          <span>{supplier.totalOrders}</span>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      sortable: true,
      cell: (supplier) => (
        <StatusBadge 
          status={supplier.status.toLowerCase() as 'active' | 'inactive' | 'suspended'} 
        />
      ),
    },
    {
      id: 'lastOrderAt',
      header: 'Last Order',
      sortable: true,
      cell: (supplier) => (
        supplier.lastOrderAt 
          ? formatDate(supplier.lastOrderAt, 'short')
          : <span className="text-gray-400">Never</span>
      ),
    },
    {
      id: 'actions',
      header: '',
      align: 'right',
      cell: (supplier) => (
        <div className="flex items-center gap-2">
          {supplier.storeUrl && (
            <a
              href={supplier.storeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 hover:bg-gray-100 rounded-md"
              onClick={(e) => e.stopPropagation()}
              aria-label="View store"
            >
              <ExternalLink className="w-4 h-4 text-gray-500" />
            </a>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedSupplier(supplier);
            }}
            className="p-2 hover:bg-gray-100 rounded-md"
            aria-label="View details"
          >
            <MoreVertical className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
          <p className="text-gray-600 mt-1">
            Manage your AliExpress suppliers
          </p>
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-2">
          <label htmlFor="status-filter" className="text-sm font-medium text-gray-700">
            Filter:
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-yellow"
          >
            <option value="all">All Suppliers</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Suppliers</p>
          <p className="text-2xl font-bold text-gray-900">{suppliers.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Active</p>
          <p className="text-2xl font-bold text-green-600">
            {suppliers.filter(s => s.status === 'ACTIVE').length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Products</p>
          <p className="text-2xl font-bold text-gray-900">
            {suppliers.reduce((sum, s) => sum + s._count.products, 0)}
          </p>
        </div>
      </div>

      {/* Suppliers table */}
      <DataTable
        columns={columns}
        data={filteredSuppliers}
        getRowId={(supplier) => supplier.id}
        searchable
        searchPlaceholder="Search suppliers..."
        paginated
        pageSize={10}
        emptyMessage="No suppliers found"
        onRowClick={(supplier) => setSelectedSupplier(supplier)}
      />

      {/* Supplier detail modal/drawer would go here */}
      {selectedSupplier && (
        <SupplierDetailDrawer
          supplier={selectedSupplier}
          onClose={() => setSelectedSupplier(null)}
        />
      )}
    </div>
  );
}

/**
 * Supplier Detail Drawer (simplified for now)
 */
function SupplierDetailDrawer({ 
  supplier, 
  onClose 
}: { 
  supplier: SupplierWithCounts; 
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{supplier.name}</h2>
              <p className="text-sm text-gray-500 mt-1">
                AliExpress ID: {supplier.aliExpressId}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-md"
              aria-label="Close"
            >
              <span className="text-gray-500">×</span>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Status */}
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <StatusBadge 
              status={supplier.status.toLowerCase() as 'active' | 'inactive' | 'suspended'} 
            />
          </div>

          {/* Rating */}
          {supplier.rating && (
            <div>
              <p className="text-sm text-gray-500">Rating</p>
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                <span className="font-medium">{supplier.rating.toFixed(1)}</span>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Products</p>
              <p className="text-xl font-bold">{supplier._count.products}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Total Orders</p>
              <p className="text-xl font-bold">{supplier.totalOrders}</p>
            </div>
          </div>

          {/* Store URL */}
          {supplier.storeUrl && (
            <div>
              <p className="text-sm text-gray-500 mb-1">Store URL</p>
              <a
                href={supplier.storeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline flex items-center gap-1"
              >
                Visit Store
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}

          {/* Dates */}
          <div className="text-sm text-gray-500">
            <p>Added: {formatDate(supplier.createdAt, 'long')}</p>
            {supplier.lastOrderAt && (
              <p>Last Order: {formatDate(supplier.lastOrderAt, 'long')}</p>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {supplier.status === 'ACTIVE' && (
            <Button variant="secondary">
              Suspend
            </Button>
          )}
          {supplier.status === 'SUSPENDED' && (
            <Button>
              Reactivate
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
