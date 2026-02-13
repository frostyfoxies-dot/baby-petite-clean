import { Metadata } from 'next';
import { Container } from '@/components/layout/container';
import { Truck, Package, Clock, Globe } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Shipping Information | Kids Petite',
  description: 'Learn about Kids Petite\'s shipping policies, delivery times, and international shipping options.',
};

/**
 * Shipping page component
 */
export default function ShippingPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gray-50 py-16 md:py-24">
        <Container>
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Shipping Information
            </h1>
            <p className="text-lg text-gray-600">
              Everything you need to know about getting your order
            </p>
          </div>
        </Container>
      </section>

      {/* Shipping Options */}
      <section className="py-16 md:py-24">
        <Container>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Shipping Options
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="w-12 h-12 bg-yellow/20 rounded-full flex items-center justify-center mb-4">
                  <Truck className="w-6 h-6 text-yellow-dark" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Standard Shipping
                </h3>
                <p className="text-gray-600 mb-4">
                  3-5 business days
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  $5.99
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Free on orders over $50
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <div className="w-12 h-12 bg-yellow/20 rounded-full flex items-center justify-center mb-4">
                  <Package className="w-6 h-6 text-yellow-dark" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Express Shipping
                </h3>
                <p className="text-gray-600 mb-4">
                  1-2 business days
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  $12.99
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Free on orders over $100
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <div className="w-12 h-12 bg-yellow/20 rounded-full flex items-center justify-center mb-4">
                  <Globe className="w-6 h-6 text-yellow-dark" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  International Shipping
                </h3>
                <p className="text-gray-600 mb-4">
                  7-14 business days
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  $24.99
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Flat rate worldwide
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Processing Time */}
      <section className="bg-gray-50 py-16 md:py-24">
        <Container>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Order Processing
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
                  Orders are typically processed within 1-2 business days. During peak seasons (holidays, sales), processing may take up to 3 business days. You will receive a confirmation email with tracking information once your order ships.
                </p>
                <p className="text-gray-600">
                  Please note that processing time is separate from shipping time. The total delivery time is the sum of processing time and shipping time.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* International Shipping */}
      <section className="py-16 md:py-24">
        <Container>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              International Shipping
            </h2>
            <div className="prose prose-lg text-gray-600 space-y-4">
              <p>
                We ship to over 100 countries worldwide. International orders are shipped via DHL Express and typically arrive within 7-14 business days, depending on the destination.
              </p>
              <p>
                <strong>Important notes for international orders:</strong>
              </p>
              <ul className="space-y-2">
                <li>International shipping rates are calculated based on destination and package weight</li>
                <li>Customers are responsible for any customs duties, taxes, or import fees imposed by their country</li>
                <li>Some items may be restricted from shipping to certain countries due to import regulations</li>
                <li>International orders cannot be modified once shipped</li>
                <li>Delivery times may vary due to customs processing</li>
              </ul>
            </div>
          </div>
        </Container>
      </section>

      {/* Shipping Restrictions */}
      <section className="bg-gray-50 py-16 md:py-24">
        <Container>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Shipping Restrictions
            </h2>
            <div className="prose prose-lg text-gray-600 space-y-4">
              <p>
                We currently do not ship to the following locations:
              </p>
              <ul className="space-y-2">
                <li>PO Boxes and APO/FPO addresses (for express shipping)</li>
                <li>Certain remote areas and islands</li>
                <li>Countries under trade sanctions</li>
              </ul>
              <p>
                If you have questions about shipping to your location, please contact our customer service team at support@kidspetite.com.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Tracking Your Order */}
      <section className="py-16 md:py-24">
        <Container>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Tracking Your Order
            </h2>
            <div className="prose prose-lg text-gray-600 space-y-4">
              <p>
                Once your order ships, you will receive a confirmation email containing your tracking number. You can use this number to track your package on the carrier's website.
              </p>
              <p>
                You can also track your order by:
              </p>
              <ul className="space-y-2">
                <li>Logging into your account and viewing your order history</li>
                <li>Using the tracking link in your shipping confirmation email</li>
                <li>Contacting our customer service team</li>
              </ul>
              <p>
                Please allow 24-48 hours for tracking information to update after receiving your shipping confirmation.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Lost or Damaged Packages */}
      <section className="bg-gray-50 py-16 md:py-24">
        <Container>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Lost or Damaged Packages
            </h2>
            <div className="prose prose-lg text-gray-600 space-y-4">
              <p>
                While we take every precaution to ensure your package arrives safely, occasionally issues may arise during transit. Here's what to do:
              </p>
              <p>
                <strong>If your package is lost:</strong>
              </p>
              <ul className="space-y-2">
                <li>Contact us within 14 days of the expected delivery date</li>
                <li>We will file a claim with the carrier and work to resolve the issue</li>
                <li>If the package cannot be located, we will send a replacement or issue a refund</li>
              </ul>
              <p>
                <strong>If your package arrives damaged:</strong>
              </p>
              <ul className="space-y-2">
                <li>Take photos of the damaged package and items</li>
                <li>Contact us within 48 hours of delivery</li>
                <li>We will arrange for a replacement or refund at no additional cost</li>
              </ul>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
