import * as React from 'react';
import { Metadata } from 'next';
import { Container } from '@/components/layout/container';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export const metadata: Metadata = {
  title: 'FAQ | Baby Petite',
  description: 'Find answers to frequently asked questions about Baby Petite products, orders, shipping, returns, and more.',
};

/**
 * Force dynamic rendering to avoid prerendering issues
 */
export const dynamic = 'force-dynamic';

/**
 * FAQ page component
 */
export default function FAQPage() {
  const faqCategories = [
    {
      title: 'Orders & Shipping',
      items: [
        {
          question: 'How long does shipping take?',
          answer: 'Standard shipping typically takes 3-5 business days. Express shipping is available for 1-2 business day delivery. International shipping may take 7-14 business days depending on the destination.',
        },
        {
          question: 'How can I track my order?',
          answer: 'Once your order ships, you will receive a confirmation email with a tracking number. You can also track your order by logging into your account and viewing your order history.',
        },
        {
          question: 'Do you offer free shipping?',
          answer: 'Yes! We offer free standard shipping on all orders over $50 within the United States. International orders have a flat rate shipping fee.',
        },
        {
          question: 'Can I change my order after it has been placed?',
          answer: 'Orders can be modified within 1 hour of placing them. After that, please contact our customer service team at support@babypetite.com and we will do our best to accommodate your request.',
        },
      ],
    },
    {
      title: 'Returns & Exchanges',
      items: [
        {
          question: 'What is your return policy?',
          answer: 'We accept returns within 30 days of purchase. Items must be unworn, unwashed, and in their original condition with tags attached. Sale items are final sale and cannot be returned.',
        },
        {
          question: 'How do I initiate a return?',
          answer: 'To initiate a return, log into your account, go to your order history, and select the order you wish to return. Follow the prompts to generate a return label. Alternatively, contact our customer service team for assistance.',
        },
        {
          question: 'Who pays for return shipping?',
          answer: 'For defective items or items sent in error, we will provide a prepaid return label. For all other returns, the customer is responsible for return shipping costs.',
        },
        {
          question: 'How long does it take to receive a refund?',
          answer: 'Once we receive and process your return, refunds are typically issued within 5-7 business days. The refund will be credited to the original payment method.',
        },
      ],
    },
    {
      title: 'Products & Sizing',
      items: [
        {
          question: 'How do I choose the right size?',
          answer: 'We provide detailed size charts for all our products. You can find the size guide on each product page. If you are between sizes, we recommend sizing up for growing children.',
        },
        {
          question: 'What materials are your clothes made from?',
          answer: 'We use high-quality, sustainable materials including organic cotton, recycled polyester, and eco-friendly blends. All materials are OEKO-TEX certified and free from harmful chemicals.',
        },
        {
          question: 'Are your clothes machine washable?',
          answer: 'Yes, all our clothes are machine washable. We recommend washing in cold water with like colors and tumble drying on low heat. Please check the care label on each garment for specific instructions.',
        },
        {
          question: 'Do you offer gift wrapping?',
          answer: 'Yes! We offer gift wrapping for an additional $5. You can select this option at checkout. Your gift will be beautifully wrapped with a personalized message.',
        },
      ],
    },
    {
      title: 'Account & Registry',
      items: [
        {
          question: 'How do I create an account?',
          answer: 'Click on the "Sign In" button in the top right corner of our website and select "Create Account". You can sign up with your email or through your Google or Facebook account.',
        },
        {
          question: 'What are the benefits of creating an account?',
          answer: 'With an account, you can track your orders, save your shipping addresses, create wishlists, manage registries, and receive exclusive offers and early access to new collections.',
        },
        {
          question: 'How do I create a baby registry?',
          answer: 'To create a registry, log into your account and navigate to the "Registry" section. Click "Create Registry" and follow the prompts to set up your registry with baby information and add items.',
        },
        {
          question: 'Can I share my registry with friends and family?',
          answer: 'Yes! Each registry has a unique share code that you can send to friends and family. They can view your registry, purchase gifts, and mark items as purchased.',
        },
      ],
    },
    {
      title: 'Payment & Security',
      items: [
        {
          question: 'What payment methods do you accept?',
          answer: 'We accept all major credit cards (Visa, MasterCard, American Express, Discover), PayPal, Apple Pay, Google Pay, and Shop Pay.',
        },
        {
          question: 'Is my payment information secure?',
          answer: 'Absolutely. We use industry-standard SSL encryption to protect your personal and payment information. We do not store your credit card details on our servers.',
        },
        {
          question: 'Do you offer payment plans?',
          answer: 'Yes, we offer Shop Pay Installments, which allows you to split your purchase into 4 interest-free payments. This option is available at checkout for orders between $50 and $1,000.',
        },
        {
          question: 'Can I use multiple payment methods for one order?',
          answer: 'Currently, we only support one payment method per order. If you have a gift card, you can apply it to your order and pay the remaining balance with another payment method.',
        },
      ],
    },
  ];

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gray-50 py-16 md:py-24">
        <Container>
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Frequently Asked Questions
            </h1>
            <p className="text-lg text-gray-600">
              Find answers to common questions about Baby Petite
            </p>
          </div>
        </Container>
      </section>

      {/* FAQ Content */}
      <section className="py-16 md:py-24">
        <Container>
          <div className="max-w-3xl mx-auto">
            {faqCategories.map((category, categoryIndex) => (
              <div key={categoryIndex} className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  {category.title}
                </h2>
                <Accordion type="single" collapsible className="space-y-4">
                  {category.items.map((item, itemIndex) => (
                    <AccordionItem
                      key={itemIndex}
                      value={`${categoryIndex}-${itemIndex}`}
                      className="border border-gray-200 rounded-lg px-6"
                    >
                      <AccordionTrigger className="text-left hover:no-underline">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-gray-600">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}

            {/* Still have questions */}
            <div className="mt-16 p-8 bg-gray-50 rounded-lg text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Still have questions?
              </h2>
              <p className="text-gray-600 mb-6">
                Can't find the answer you're looking for? Our friendly team is here to help.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="mailto:support@babypetite.com" className="inline-flex items-center justify-center px-6 py-3 bg-yellow-dark text-white font-medium rounded-md hover:bg-yellow transition-colors">
                  Email Us
                </a>
                <a href="tel:+15551234567" className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-900 font-medium rounded-md hover:bg-gray-50 transition-colors">
                  Call Us
                </a>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
