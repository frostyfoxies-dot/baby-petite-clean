import { Metadata } from 'next';
import { Container } from '@/components/layout/container';
import { RotateCcw, Package, Clock, AlertCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Returns & Exchanges | Kids Petite',
  description: 'Learn about Kids Petite\'s return and exchange policy. Easy returns within 30 days of purchase.',
};

/**
 * Returns page component
 */
export default function ReturnsPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gray-50 py-16 md:py-24">
        <Container>
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Returns & Exchanges
            </h1>
            <p className="text-lg text-gray-600">
              Hassle-free returns within 30 days
            </p>
          </div>
        </Container>
      </section>

      {/* Return Policy */}
      <section className="py-16 md:py-24">
        <Container>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Our Return Policy
            </h2>
            <div className="prose prose-lg text-gray-600 space-y-4">
              <p>
                At Kids Petite, we want you to be completely satisfied with your purchase. If you're not happy with your order, we offer easy returns within 30 days of purchase.
              </p>
              <p>
                <strong>Return eligibility:</strong>
              </p>
              <ul className="space-y-2">
                <li>Items must be returned within 30 days of purchase</li>
                <li>Items must be unworn, unwashed, and in original condition</li>
                <li>Original tags must be attached</li>
                <li>Original packaging must be included (if applicable)</li>
              </ul>
              <p>
                <strong>Non-returnable items:</strong>
              </p>
              <ul className="space-y-2">
                <li>Items marked as "Final Sale"</li>
                <li>Personalized or custom items</li>
                <li>Items purchased during special promotions (unless otherwise stated)</li>
                <li>Gift cards</li>
              </ul>
            </div>
          </div>
        </Container>
      </section>

      {/* How to Return */}
      <section className="bg-gray-50 py-16 md:py-24">
        <Container>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              How to Return an Item
            </h2>
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-yellow-dark text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                  1
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Initiate Your Return
                  </h3>
                  <p className="text-gray-600">
                    Log into your account, go to your order history, and select the order you wish to return. Click "Return Items" and follow the prompts to select the items you want to return and the reason for return.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-yellow-dark text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                  2
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Print Your Return Label
                  </h3>
                  <p className="text-gray-600">
                    Once your return is approved, you will receive a return shipping label via email. Print the label and attach it to your package.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-yellow-dark text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                  3
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Package Your Items
                  </h3>
                  <p className="text-gray-600">
                    Pack the items securely in their original packaging or a suitable box. Include all tags and accessories. Seal the package and attach the return label.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-yellow-dark text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                  4
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Ship Your Return
                  </h3>
                  <p className="text-gray-600">
                    Drop off your package at any authorized shipping location. You will receive a tracking number to monitor your return shipment.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-yellow-dark text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                  5
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Receive Your Refund
                  </h3>
                  <p className="text-gray-600">
                    Once we receive and process your return, your refund will be issued to your original payment method within 5-7 business days.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Return Shipping Costs */}
      <section className="py-16 md:py-24">
        <Container>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Return Shipping Costs
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Package className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Free Returns
                </h3>
                <p className="text-gray-600">
                  Returns for defective items, items sent in error, or exchanges are free. We will provide a prepaid return label.
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <div className="w-12 h-12 bg-yellow/20 rounded-full flex items-center justify-center mb-4">
                  <RotateCcw className="w-6 h-6 text-yellow-dark" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Standard Returns
                </h3>
                <p className="text-gray-600">
                  For all other returns, a $5.99 shipping fee will be deducted from your refund. This fee covers the cost of return shipping.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Exchanges */}
      <section className="bg-gray-50 py-16 md:py-24">
        <Container>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Exchanges
            </h2>
            <div className="prose prose-lg text-gray-600 space-y-4">
              <p>
                We offer free exchanges for different sizes or colors of the same item. To exchange an item:
              </p>
              <ol className="space-y-2">
                <li>Follow the return process outlined above</li>
                <li>Select "Exchange" as your return reason</li>
                <li>Choose the size or color you would like instead</li>
                <li>We will ship your new item once we receive your return</li>
              </ol>
              <p>
                If you would like to exchange for a different item, please return the original item for a refund and place a new order for the item you want.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Refund Timeline */}
      <section className="py-16 md:py-24">
        <Container>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Refund Timeline
            </h2>
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-yellow/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Clock className="w-6 h-6 text-yellow-dark" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Processing Time
                </h3>
                <p className="text-gray-600 mb-4">
                  Once we receive your return, it typically takes 1-2 business days to process. You will receive an email confirmation when your refund has been issued.
                </p>
                <p className="text-gray-600">
                  The refund will be credited to your original payment method. Depending on your bank or credit card issuer, it may take an additional 3-5 business days for the refund to appear in your account.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Important Notes */}
      <section className="bg-yellow py-16 md:py-24">
        <Container>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Important Notes
            </h2>
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-gray-900" />
              </div>
              <div className="prose prose-lg text-gray-900 space-y-4">
                <p>
                  <strong>Gift Returns:</strong> If you received an item as a gift, you can return it for store credit. Please contact our customer service team for assistance.
                </p>
                <p>
                  <strong>International Returns:</strong> International customers are responsible for return shipping costs. Please contact our customer service team before returning international orders.
                </p>
                <p>
                  <strong>Return Address:</strong> Please use the return label provided. Do not send returns to our corporate address.
                </p>
                <p>
                  <strong>Questions?</strong> If you have any questions about our return policy, please contact our customer service team at support@kidspetite.com.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
