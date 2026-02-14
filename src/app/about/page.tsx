import { Metadata } from 'next';
import { Container } from '@/components/layout/container';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About Baby Petite | Premium Children\'s Clothing',
  description: 'Learn about Baby Petite\'s mission to provide premium, sustainable children\'s clothing that grows with your little ones.',
};

/**
 * About page component
 */
export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gray-50 py-16 md:py-24">
        <Container>
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              About Baby Petite
            </h1>
            <p className="text-lg text-gray-600">
              Premium children's clothing that grows with your little ones
            </p>
          </div>
        </Container>
      </section>

      {/* Our Story */}
      <section className="py-16 md:py-24">
        <Container>
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Our Story
            </h2>
            <div className="prose prose-lg text-gray-600 space-y-4">
              <p>
                Baby Petite was born from a simple observation: children grow fast, but their clothes shouldn't have to be replaced just as quickly. Founded in 2020, we set out to create a children's clothing brand that combines premium quality, sustainable practices, and thoughtful design.
              </p>
              <p>
                Our journey began when our founder, a parent herself, struggled to find clothing that was both durable enough for active play and stylish enough for special occasions. She noticed that most children's clothing was either too expensive or too disposable, neither of which aligned with her values.
              </p>
              <p>
                Today, Baby Petite is proud to offer a curated collection of children's clothing that meets the highest standards of quality, sustainability, and style. Every piece in our collection is carefully selected to ensure it can withstand the adventures of childhood while looking beautiful.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Our Values */}
      <section className="bg-gray-50 py-16 md:py-24">
        <Container>
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
              Our Values
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-yellow/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-yellow-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Quality
                </h3>
                <p className="text-gray-600">
                  We believe in creating clothing that lasts. Every piece is made with premium materials and expert craftsmanship.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-yellow/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-yellow-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Sustainability
                </h3>
                <p className="text-gray-600">
                  We're committed to reducing our environmental impact through sustainable materials and ethical manufacturing.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-yellow/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-yellow-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Community
                </h3>
                <p className="text-gray-600">
                  We're more than a clothing brand. We're a community of parents who care about giving their children the best.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Our Commitment */}
      <section className="py-16 md:py-24">
        <Container>
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Our Commitment
            </h2>
            <div className="prose prose-lg text-gray-600 space-y-4">
              <p>
                At Baby Petite, we're committed to making a positive impact on the world. Here's how we're doing it:
              </p>
              <ul className="space-y-2">
                <li>
                  <strong>Ethical Manufacturing:</strong> All our products are made in factories that meet strict labor standards and provide fair wages.
                </li>
                <li>
                  <strong>Sustainable Materials:</strong> We prioritize organic cotton, recycled materials, and other eco-friendly fabrics.
                </li>
                <li>
                  <strong>Minimal Packaging:</strong> We use recyclable and biodegradable packaging to reduce waste.
                </li>
                <li>
                  <strong>Charitable Giving:</strong> We donate a portion of our profits to organizations that support children in need.
                </li>
              </ul>
            </div>
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="bg-yellow py-16 md:py-24">
        <Container>
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Join the Baby Petite Family
            </h2>
            <p className="text-lg text-gray-700 mb-8">
              Discover our collection of premium children's clothing and experience the difference quality makes.
            </p>
            <Link href="/products">
              <Button size="lg" variant="secondary">
                Shop Now
              </Button>
            </Link>
          </div>
        </Container>
      </section>
    </main>
  );
}
