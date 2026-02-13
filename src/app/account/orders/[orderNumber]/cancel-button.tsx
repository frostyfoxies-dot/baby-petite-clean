'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cancelOrder } from '@/actions/orders';
import { AlertCircle, XCircle } from 'lucide-react';

interface CancelOrderButtonProps {
  orderNumber: string;
}

/**
 * Cancel order button component
 * Allows users to cancel orders that haven't been shipped yet
 */
export default function CancelOrderButton({ orderNumber }: CancelOrderButtonProps) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [isCancelling, setIsCancelling] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleCancel = async () => {
    setIsCancelling(true);
    setError(null);

    try {
      const result = await cancelOrder(orderNumber);

      if (result.success) {
        router.refresh();
        router.push('/account/orders?cancelled=true');
      } else {
        setError(result.error || 'Failed to cancel order');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsCancelling(false);
    }
  };

  if (showConfirm) {
    return (
      <div className="flex flex-col gap-3 p-4 bg-red-50 rounded-lg">
        <div className="flex items-center gap-2 text-red-700">
          <AlertCircle className="w-5 h-5" />
          <p className="font-medium">Cancel this order?</p>
        </div>
        <p className="text-sm text-red-600">
          This action cannot be undone. A refund will be processed automatically.
        </p>
        {error && (
          <p className="text-sm text-red-700 font-medium">{error}</p>
        )}
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowConfirm(false)}
            disabled={isCancelling}
          >
            Keep Order
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 border-red-200 hover:bg-red-100"
            onClick={handleCancel}
            loading={isCancelling}
          >
            Yes, Cancel Order
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="text-red-600 border-red-200 hover:bg-red-50"
      leftIcon={<XCircle className="w-4 h-4" />}
      onClick={() => setShowConfirm(true)}
    >
      Cancel Order
    </Button>
  );
}
