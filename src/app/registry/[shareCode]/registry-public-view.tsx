'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Share2, Calendar, Gift, ShoppingCart, CheckCircle, ExternalLink } from 'lucide-react';
import { RegistryShare } from '@/components/registry/registry-share';
import { purchaseRegistryItem } from '@/actions/registry';
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
  isOwner: boolean;
  items: RegistryItem[];
}

/**
 * Client component for public registry view
 */
export function RegistryPublicView({ registry }: { registry: RegistryData }) {
  const [showShare, setShowShare] = React.useState(false);
  const [purchasingItems, setPurchasingItems] = React.useState<Set<string>>(new Set());
  const [items, setItems] = React.useState(registry.items);

  const totalItems = items.length;
  const fulfilledItems = items.filter((item) => item.quantityPurchased >= item.quantity).length;
  const progress = totalItems > 0 ? (fulfilledItems / totalItems) * 100 : 0;

  const handlePurchase = async (itemId: string) => {
    setPurchasingItems((prev) => new Set(prev).add(itemId));

    const result = await purchaseRegistryItem({
      shareCode: registry.shareCode,
      itemId,
      quantity: 1,
    });

    setPurchasingItems((prev) => {
      const next = new Set(prev);
      next.delete(itemId);
      return next;
    });

    if (result.success) {
      // Update local state
      setItems((prevItems) =>
        prevItems.map((item) =>
          item.id === itemId
            ? { ...item, quantityPurchased: item.quantityPurchased + 1 }
            : item
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
      {/* Registry header */}
      <div className="bg-gray-50 border-b border-gray-200 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="w-20 h-20 bg-yellow/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Gift className="w-10 h-10 text-yellow-dark" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              {registry.name}
            </h1>
            {registry.description && (
              <p className="text-gray-600 mb-4 max-w-2xl mx-auto italic">
                "{registry.description}"
              </p>
            )}
            <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
              {registry.eventDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Event: {new Date(registry.eventDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              )}
            </div>
            {registry.isOwner && (
              <div className="mt-4">
                <Link href={`/registry/${registry.shareCode}/manage`}>
                  <Button variant="outline" size="sm">
                    Manage Registry
                  </Button>
                </Link>
              </div>
            )}
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

        {/* Actions */}
        <div className="flex justify-center gap-3 mb-8">
          <Button
            variant="outline"
            leftIcon={<Share2 className="w-4 h-4" />}
            onClick={() => setShowShare(true)}
          >
            Share Registry
          </Button>
        </div>

        {/* Registry items */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Registry Items ({items.length})
          </h2>

          {items.length === 0 ? (
            <div className="bg-white rounded-lg p-12 text-center">
              <Gift className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                No items in this registry yet
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((item) => {
                const isFulfilled = item.quantityPurchased >= item.quantity;
                const remaining = item.quantity - item.quantityPurchased;
                const isPurchasing = purchasingItems.has(item.id);

                return (
                  <div
                    key={item.id}
                    className={`bg-white rounded-lg p-4 border ${
                      isFulfilled ? 'border-green-200 bg-green-50/50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
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
                      <div className="text-sm text-gray-600">
                        <span className={isFulfilled ? 'text-green-600' : ''}>
                          {item.quantityPurchased} / {item.quantity} fulfilled
                        </span>
                      </div>

                      {isFulfilled ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">Fulfilled</span>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Link href={`/products/${item.productSlug}`}>
                            <Button variant="outline" size="sm" leftIcon={<ExternalLink className="w-3 h-3" />}>
                              View
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            onClick={() => handlePurchase(item.id)}
                            loading={isPurchasing}
                            leftIcon={<ShoppingCart className="w-3 h-3" />}
                          >
                            Mark Purchased
                          </Button>
                        </div>
                      )}
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
