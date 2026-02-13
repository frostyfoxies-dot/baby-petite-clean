import { Metadata } from 'next';
import { Container } from '@/components/layout/container';
import { FileText, AlertTriangle, Scale, Users } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service | Kids Petite',
  description: 'Kids Petite\'s terms of service. Read our terms and conditions for using our website and services.',
};

/**
 * Terms page component
 */
export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gray-50 py-16 md:py-24">
        <Container>
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Terms of Service
            </h1>
            <p className="text-lg text-gray-600">
              Last updated: January 1, 2025
            </p>
          </div>
        </Container>
      </section>

      {/* Introduction */}
      <section className="py-16 md:py-24">
        <Container>
          <div className="max-w-4xl mx-auto">
            <div className="prose prose-lg text-gray-600 space-y-4">
              <p>
                Welcome to Kids Petite. These Terms of Service ("Terms") govern your use of our website and services. By accessing or using Kids Petite, you agree to be bound by these Terms.
              </p>
              <p>
                Please read these Terms carefully before using our website. If you do not agree with these Terms, you may not use our website or services.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Acceptance of Terms */}
      <section className="bg-gray-50 py-16 md:py-24">
        <Container>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Acceptance of Terms
            </h2>
            <div className="prose prose-lg text-gray-600 space-y-4">
              <p>
                By accessing or using Kids Petite, you acknowledge that you have read, understood, and agree to be bound by these Terms. If you do not agree to these Terms, you must not use our website.
              </p>
              <p>
                We reserve the right to modify these Terms at any time. Your continued use of the website after any changes constitutes acceptance of the updated Terms.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Account Registration */}
      <section className="py-16 md:py-24">
        <Container>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Account Registration
            </h2>
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-yellow/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-yellow-dark" />
              </div>
              <div className="prose prose-lg text-gray-600 space-y-4">
                <p>
                  To access certain features of our website, you may be required to create an account. When creating an account, you agree to:
                </p>
                <ul className="space-y-2">
                  <li>Provide accurate, current, and complete information</li>
                  <li>Maintain and update your account information</li>
                  <li>Keep your password secure and confidential</li>
                  <li>Accept responsibility for all activities under your account</li>
                  <li>Notify us immediately of any unauthorized use</li>
                </ul>
                <p>
                  You are responsible for maintaining the confidentiality of your account and for all activities that occur under your account. We reserve the right to terminate accounts that violate these Terms.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Products and Services */}
      <section className="bg-gray-50 py-16 md:py-24">
        <Container>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Products and Services
            </h2>
            <div className="prose prose-lg text-gray-600 space-y-4">
              <p>
                We strive to provide accurate descriptions and images of our products. However, we do not warrant that product descriptions, colors, or other content are accurate, complete, reliable, current, or error-free.
              </p>
              <p>
                <strong>Product Availability:</strong> All products are subject to availability. We reserve the right to discontinue any product at any time without notice.
              </p>
              <p>
                <strong>Pricing:</strong> Prices are subject to change without notice. We reserve the right to modify prices or discontinue products at any time. We are not responsible for typographical errors.
              </p>
              <p>
                <strong>Product Images:</strong> Product images are for illustrative purposes only and may not exactly represent the actual product.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Orders and Payment */}
      <section className="py-16 md:py-24">
        <Container>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Orders and Payment
            </h2>
            <div className="prose prose-lg text-gray-600 space-y-4">
              <p>
                By placing an order on our website, you offer to purchase products subject to these Terms. We reserve the right to accept or decline your order at our sole discretion.
              </p>
              <p>
                <strong>Order Confirmation:</strong> You will receive an order confirmation email after placing your order. This email does not constitute acceptance of your order.
              </p>
              <p>
                <strong>Payment:</strong> Payment is due at the time of purchase. We accept various payment methods as listed on our website. By providing payment information, you represent that you are authorized to use the payment method.
              </p>
              <p>
                <strong>Order Cancellation:</strong> You may cancel your order within 1 hour of placing it. After that, orders cannot be cancelled once they have entered the processing stage.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Shipping and Delivery */}
      <section className="bg-gray-50 py-16 md:py-24">
        <Container>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Shipping and Delivery
            </h2>
            <div className="prose prose-lg text-gray-600 space-y-4">
              <p>
                Shipping times are estimates and are not guaranteed. We are not responsible for delays caused by shipping carriers, customs, or other factors beyond our control.
              </p>
              <p>
                <strong>Risk of Loss:</strong> All items purchased from Kids Petite are made pursuant to a shipment contract. This means that the risk of loss and title for such items pass to you upon our delivery to the carrier.
              </p>
              <p>
                <strong>International Orders:</strong> You are responsible for any customs duties, taxes, or import fees imposed by your country. We are not responsible for packages held by customs.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Returns and Refunds */}
      <section className="py-16 md:py-24">
        <Container>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Returns and Refunds
            </h2>
            <div className="prose prose-lg text-gray-600 space-y-4">
              <p>
                Our return policy is outlined separately on our website. Please refer to our Returns & Exchanges page for detailed information about returns, exchanges, and refunds.
              </p>
              <p>
                By making a purchase, you agree to our return policy. We reserve the right to modify our return policy at any time.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Intellectual Property */}
      <section className="bg-gray-50 py-16 md:py-24">
        <Container>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Intellectual Property
            </h2>
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-yellow/20 rounded-full flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6 text-yellow-dark" />
              </div>
              <div className="prose prose-lg text-gray-600 space-y-4">
                <p>
                  All content on this website, including text, graphics, logos, images, and software, is the property of Kids Petite or its content suppliers and is protected by copyright and other intellectual property laws.
                </p>
                <p>
                  You may not reproduce, distribute, modify, create derivative works of, publicly display, publicly perform, republish, download, store, or transmit any of the material on our website without our prior written consent.
                </p>
                <p>
                  The Kids Petite name, logo, and all related names, logos, product and service names, designs, and slogans are trademarks of Kids Petite or its affiliates. You may not use such marks without our prior written permission.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* User Conduct */}
      <section className="py-16 md:py-24">
        <Container>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              User Conduct
            </h2>
            <div className="prose prose-lg text-gray-600 space-y-4">
              <p>
                You agree not to use our website for any unlawful purpose or in any way that could damage, disable, overburden, or impair our website or interfere with any other party's use of our website.
              </p>
              <p>
                <strong>Prohibited activities include:</strong>
              </p>
              <ul className="space-y-2">
                <li>Using automated tools to access our website</li>
                <li>Attempting to gain unauthorized access to our systems</li>
                <li>Interfering with the security or operation of our website</li>
                <li>Posting or transmitting harmful, illegal, or offensive content</li>
                <li>Violating any applicable laws or regulations</li>
                <li>Infringing on the rights of others</li>
              </ul>
            </div>
          </div>
        </Container>
      </section>

      {/* Limitation of Liability */}
      <section className="bg-gray-50 py-16 md:py-24">
        <Container>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Limitation of Liability
            </h2>
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-yellow/20 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-yellow-dark" />
              </div>
              <div className="prose prose-lg text-gray-600 space-y-4">
                <p>
                  To the fullest extent permitted by law, Kids Petite shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, use, goodwill, or other intangible losses.
                </p>
                <p>
                  Our total liability to you for all claims arising from or related to these Terms or your use of our website shall not exceed the amount you paid to us, if any, for accessing or using our website.
                </p>
                <p>
                  Some jurisdictions do not allow the exclusion of certain warranties or the limitation of liability, so the above limitations may not apply to you.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Indemnification */}
      <section className="py-16 md:py-24">
        <Container>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Indemnification
            </h2>
            <div className="prose prose-lg text-gray-600 space-y-4">
              <p>
                You agree to indemnify, defend, and hold harmless Kids Petite and its affiliates, officers, directors, employees, and agents from and against any claims, damages, obligations, losses, liabilities, costs, or debt, and expenses (including but not limited to attorney's fees).
              </p>
              <p>
                This includes claims resulting from or relating to your use of our website, your violation of these Terms, or your violation of any rights of another.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Governing Law */}
      <section className="bg-gray-50 py-16 md:py-24">
        <Container>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Governing Law
            </h2>
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-yellow/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Scale className="w-6 h-6 text-yellow-dark" />
              </div>
              <div className="prose prose-lg text-gray-600 space-y-4">
                <p>
                  These Terms shall be governed by and construed in accordance with the laws of the State of New York, without regard to its conflict of law provisions.
                </p>
                <p>
                  Any disputes arising from or relating to these Terms or your use of our website shall be resolved in the courts of New York, New York.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Termination */}
      <section className="py-16 md:py-24">
        <Container>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Termination
            </h2>
            <div className="prose prose-lg text-gray-600 space-y-4">
              <p>
                We reserve the right to terminate or suspend your account and access to our website at our sole discretion, without prior notice, for any reason, including but not limited to:
              </p>
              <ul className="space-y-2">
                <li>Violation of these Terms</li>
                <li>Fraudulent or illegal activity</li>
                <li>Failure to pay for products or services</li>
                <li>Any other reason at our sole discretion</li>
              </ul>
              <p>
                Upon termination, your right to use our website will immediately cease. All provisions of these Terms which by their nature should survive termination shall survive.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Changes to Terms */}
      <section className="bg-gray-50 py-16 md:py-24">
        <Container>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Changes to Terms
            </h2>
            <div className="prose prose-lg text-gray-600 space-y-4">
              <p>
                We reserve the right to modify these Terms at any time. We will notify you of any material changes by posting the updated Terms on our website and updating the "Last updated" date.
              </p>
              <p>
                Your continued use of our website after any changes constitutes acceptance of the updated Terms. It is your responsibility to review these Terms periodically.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Contact Us */}
      <section className="bg-yellow py-16 md:py-24">
        <Container>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Contact Us
            </h2>
            <div className="prose prose-lg text-gray-900 space-y-4">
              <p>
                If you have any questions about these Terms, please contact us:
              </p>
              <p>
                <strong>Email:</strong> legal@kidspetite.com<br />
                <strong>Address:</strong> 123 Fashion Street, New York, NY 10001, United States
              </p>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
