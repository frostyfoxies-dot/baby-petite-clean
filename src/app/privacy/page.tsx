import { Metadata } from 'next';
import { Container } from '@/components/layout/container';
import { Shield, Eye, Lock, Database } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy | Kids Petite',
  description: 'Kids Petite\'s privacy policy. Learn how we collect, use, and protect your personal information.',
};

/**
 * Privacy page component
 */
export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gray-50 py-16 md:py-24">
        <Container>
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Privacy Policy
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
                At Kids Petite, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and make purchases.
              </p>
              <p>
                By using Kids Petite, you consent to the data practices described in this policy. If you do not agree with the terms of this privacy policy, please do not access our website.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Information We Collect */}
      <section className="bg-gray-50 py-16 md:py-24">
        <Container>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Information We Collect
            </h2>
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="w-12 h-12 bg-yellow/20 rounded-full flex items-center justify-center mb-4">
                  <Eye className="w-6 h-6 text-yellow-dark" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Personal Information
                </h3>
                <ul className="text-gray-600 space-y-1 text-sm">
                  <li>Name and contact information</li>
                  <li>Shipping and billing addresses</li>
                  <li>Payment information</li>
                  <li>Account credentials</li>
                </ul>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <div className="w-12 h-12 bg-yellow/20 rounded-full flex items-center justify-center mb-4">
                  <Database className="w-6 h-6 text-yellow-dark" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Usage Information
                </h3>
                <ul className="text-gray-600 space-y-1 text-sm">
                  <li>Browsing history</li>
                  <li>Pages viewed</li>
                  <li>Click patterns</li>
                  <li>Device information</li>
                </ul>
              </div>
            </div>
            <div className="prose prose-lg text-gray-600 space-y-4">
              <p>
                We collect information you provide directly to us, such as when you create an account, make a purchase, or contact us. We also collect information automatically as you navigate our website.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* How We Use Your Information */}
      <section className="py-16 md:py-24">
        <Container>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              How We Use Your Information
            </h2>
            <div className="prose prose-lg text-gray-600 space-y-4">
              <p>
                We use the information we collect for various purposes, including:
              </p>
              <ul className="space-y-2">
                <li><strong>Processing transactions:</strong> To process and fulfill your orders</li>
                <li><strong>Account management:</strong> To create and manage your account</li>
                <li><strong>Customer service:</strong> To respond to your inquiries and provide support</li>
                <li><strong>Personalization:</strong> To personalize your shopping experience</li>
                <li><strong>Marketing:</strong> To send you promotional emails (with your consent)</li>
                <li><strong>Improvement:</strong> To improve our website, products, and services</li>
                <li><strong>Security:</strong> To detect and prevent fraud and abuse</li>
                <li><strong>Legal compliance:</strong> To comply with legal obligations</li>
              </ul>
            </div>
          </div>
        </Container>
      </section>

      {/* Information Sharing */}
      <section className="bg-gray-50 py-16 md:py-24">
        <Container>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Information Sharing
            </h2>
            <div className="prose prose-lg text-gray-600 space-y-4">
              <p>
                We do not sell your personal information. We may share your information with third parties in the following circumstances:
              </p>
              <ul className="space-y-2">
                <li><strong>Service providers:</strong> We share information with trusted third parties who assist us in operating our website, conducting our business, or servicing you</li>
                <li><strong>Payment processors:</strong> We share payment information with our payment processors to process transactions</li>
                <li><strong>Shipping partners:</strong> We share shipping information with our shipping partners to deliver your orders</li>
                <li><strong>Legal requirements:</strong> We may disclose information if required by law or to protect our rights</li>
                <li><strong>Business transfers:</strong> In the event of a merger, acquisition, or sale of assets, your information may be transferred</li>
              </ul>
            </div>
          </div>
        </Container>
      </section>

      {/* Data Security */}
      <section className="py-16 md:py-24">
        <Container>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Data Security
            </h2>
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-yellow/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-yellow-dark" />
              </div>
              <div className="prose prose-lg text-gray-600 space-y-4">
                <p>
                  We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include:
                </p>
                <ul className="space-y-2">
                  <li>SSL encryption for all data transmission</li>
                  <li>Secure payment processing through PCI-compliant providers</li>
                  <li>Regular security audits and updates</li>
                  <li>Restricted access to personal information</li>
                  <li>Secure data storage facilities</li>
                </ul>
                <p>
                  However, no method of transmission over the internet is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Cookies and Tracking */}
      <section className="bg-gray-50 py-16 md:py-24">
        <Container>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Cookies and Tracking
            </h2>
            <div className="prose prose-lg text-gray-600 space-y-4">
              <p>
                We use cookies and similar tracking technologies to collect information about your browsing behavior and to improve your experience on our website.
              </p>
              <p>
                <strong>Types of cookies we use:</strong>
              </p>
              <ul className="space-y-2">
                <li><strong>Essential cookies:</strong> Required for the website to function properly</li>
                <li><strong>Performance cookies:</strong> Help us understand how visitors use our website</li>
                <li><strong>Functionality cookies:</strong> Remember your preferences and settings</li>
                <li><strong>Marketing cookies:</strong> Used to deliver relevant advertisements</li>
              </ul>
              <p>
                You can control cookie settings through your browser preferences. Please note that disabling certain cookies may affect the functionality of our website.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Your Rights */}
      <section className="py-16 md:py-24">
        <Container>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Your Privacy Rights
            </h2>
            <div className="prose prose-lg text-gray-600 space-y-4">
              <p>
                Depending on your location, you may have certain rights regarding your personal information:
              </p>
              <ul className="space-y-2">
                <li><strong>Access:</strong> Request access to your personal information</li>
                <li><strong>Correction:</strong> Request correction of inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your personal information</li>
                <li><strong>Portability:</strong> Request a copy of your information in a portable format</li>
                <li><strong>Objection:</strong> Object to processing of your information</li>
                <li><strong>Restriction:</strong> Request restriction of processing</li>
              </ul>
              <p>
                To exercise these rights, please contact us at privacy@kidspetite.com. We will respond to your request within 30 days.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Children's Privacy */}
      <section className="bg-gray-50 py-16 md:py-24">
        <Container>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Children's Privacy
            </h2>
            <div className="prose prose-lg text-gray-600 space-y-4">
              <p>
                Our website is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately.
              </p>
              <p>
                If we become aware that we have collected personal information from a child under 13 without parental consent, we will take steps to remove that information from our servers.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Changes to This Policy */}
      <section className="py-16 md:py-24">
        <Container>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Changes to This Policy
            </h2>
            <div className="prose prose-lg text-gray-600 space-y-4">
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.
              </p>
              <p>
                We encourage you to review this Privacy Policy periodically to stay informed about how we protect your information.
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
                If you have any questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <p>
                <strong>Email:</strong> privacy@kidspetite.com<br />
                <strong>Address:</strong> 123 Fashion Street, New York, NY 10001, United States
              </p>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
