'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Share2, Settings, Trash2, ExternalLink, TrendingUp } from 'lucide-react';
import { RegistryShare } from '@/components/registry/registry-share';
import { removeRegistryItem, updateRegistryItem } from '@/actions/registry';
import { Priority } from '@prisma/client';

interface RegistryItem {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  variantId: string | null;
  variantName: string | null;
  quantity: number;
  quantityPurchased: number;
  priority: Priority;
  notes: string | null;
}

interface RegistryData {
  id: string;
  name: string;
  description: string | null;
  eventDate: Date | null;
  shareCode: string;
  isPublic: boolean;
  items: RegistryItem[];
}

/**
 * Client component for registry management
 */
export function RegistryManageView({ registry }: { registry: RegistryData }) {
  const router = useRouter();
  const [showShare, setShowShare] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [items, setItems] = React.useState(registry.items);
  const [removingItems, setRemovingItems] = React.useState<Set<string>>(new Set());

  const totalItems = items.length;
  const fulfilledItems = items.filter((item) => item.quantityPurchased >= item.quantity).length;
  const progress = totalItems > 0 ? (fulfilledItems / totalItems) * 100 : 0;

  const filteredItems = items.filter((item) =>
    item.productName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRemoveItem = async (itemId: string) => {
    setRemovingItems((prev) => new Set(prev).add(itemId));

    const result = await removeRegistryItem(registry.shareCode, itemId);

    setRemovingItems((prev) => {
      const next = new Set(prev);
      next.delete(itemId);
      return next;
    });

    if (result.success) {
      setItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
    } else {
      // Could show error toast here
      console.error('Failed to remove item:', result.error);
    }
  };

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    const result = await updateRegistryItem(registry.shareCode, itemId, {
      quantity: newQuantity,
    });

    if (result.success) {
      setItems((prevItems) =>
        prevItems.map((item) =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case Priority.HIGH:
        return 'bg-red-100 text-red-800';
      case Priority.MEDIUM:
        return 'bg-yellow-100 text-yellow-800';
      case Priority.LOW:
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen">
      {/* Page header */}
      <div className="bg-gray-50 border-b border-gray-200 py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Manage Registry
              </h1>
              <p className="text-gray-600 mt-1">
                {registry.name}
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                leftIcon={<Share2 className="w-4 h-4" />}
                onClick={() => setShowShare(true)}
              >
                Share
              </Button>
              <Link href={`/registry/${registry.shareCode}/growth`}>
                <Button variant="outline" leftIcon={<TrendingUp className="w-4 h-4" />}>
                  Growth
                </Button>
              </Link>
              <Link href={`/registry/${registry.shareCode}`}>
                <Button variant="outline" leftIcon={<ExternalLink className="w-4 h-4" />}>
                  View Public
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Progress */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-900">
              Registry Progress
            </span>
            <span className="text-sm text-gray-600">
              {fulfilledItems} of {totalItems} items fulfilled
            </span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-yellow transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Search and add */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Link href="/products">
            <Button leftIcon={<Plus className="w-4 h-4" />}>
              Add Items
            </Button>
          </Link>
        </div>

        {/* Registry items */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Registry Items ({filteredItems.length})
            </h2>
          </div>

          {filteredItems.length === 0 ? (
            <div className="bg-white rounded-lg p-12 text-center">
              <p className="text-gray-600 mb-4">
                {searchQuery ? 'No items found matching your search' : 'No items in your registry yet'}
              </p>
              <Link href="/products">
                <Button leftIcon={<Plus className="w-4 h-4" />}>
                  Add Items
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map((item) => {
                const isFulfilled = item.quantityPurchased >= item.quantity;
                const isRemoving = removingItems.has(item.id);

                return (
                  <div
                    key={item.id}
                    className={`bg-white rounded-lg p-4 border relative group ${
                      isFulfilled ? 'border-green-200 bg-green-50/50' : 'border-gray-200'
                    }`}
                  >
                    {/* Remove button */}
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      disabled={isRemoving}
                      className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-white rounded-sm opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                      aria-label="Remove item"
                    >
                      <Trash2 className={`w-4 h-4 ${isRemoving ? 'text-gray-400' : 'text-red-500'}`} />
                    </button>

                    <div className="flex items-start justify-between mb-2 pr-8">
                      <div className="flex-1">
                        <Link
                          href={`/products/${item.productSlug}`}
                          className="text-lg font-medium text-gray-900 hover:text-yellow-dark transition-colors"
                        >
                          {item.productName}
                        </Link>
                        {item.variantName && (
                          <p className="text-sm text-gray-500">{item.variantName}</p>
                        )}
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded ${getPriorityColor(item.priority)}`}
                      >
                        {item.priority}
                      </span>
                    </div>

                    {item.notes && (
                      <p className="text-sm text-gray-600 mb-3 italic">"{item.notes}"</p>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600">Qty:</label>
                        <select
                          value={item.quantity}
                          onChange={(e) => handleUpdateQuantity(item.id, parseInt(e.target.value))}
                          className="text-sm border border-gray-200 rounded px-2 py-1"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                            <option key={num} value={num}>
                              {num}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="text-sm text-gray-600">
                        <span className={isFulfilled ? 'text-green-600' : ''}>
                          {item.quantityPurchased} purchased
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Share dialog */}
      {showShare && (
        <RegistryShare
          shareCode={registry.shareCode}
          registryName={registry.name}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  );
}
