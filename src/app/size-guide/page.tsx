import { Metadata } from 'next';
import { Container } from '@/components/layout/container';
import { Ruler, Baby, Shirt, Pants } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Size Guide | Kids Petite',
  description: 'Find the perfect fit for your child with Kids Petite\'s comprehensive size guide.',
};

/**
 * Size guide page component
 */
export default function SizeGuidePage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gray-50 py-16 md:py-24">
        <Container>
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Size Guide
            </h1>
            <p className="text-lg text-gray-600">
              Find the perfect fit for your little one
            </p>
          </div>
        </Container>
      </section>

      {/* How to Measure */}
      <section className="py-16 md:py-24">
        <Container>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              How to Measure
            </h2>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="w-12 h-12 bg-yellow/20 rounded-full flex items-center justify-center mb-4">
                  <Ruler className="w-6 h-6 text-yellow-dark" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Height
                </h3>
                <p className="text-gray-600 text-sm">
                  Measure from the top of the head to the floor, standing straight without shoes.
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <div className="w-12 h-12 bg-yellow/20 rounded-full flex items-center justify-center mb-4">
                  <Shirt className="w-6 h-6 text-yellow-dark" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Chest
                </h3>
                <p className="text-gray-600 text-sm">
                  Measure around the fullest part of the chest, under the arms, keeping the tape level.
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <div className="w-12 h-12 bg-yellow/20 rounded-full flex items-center justify-center mb-4">
                  <Pants className="w-6 h-6 text-yellow-dark" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Waist
                </h3>
                <p className="text-gray-600 text-sm">
                  Measure around the natural waistline, above the belly button.
                </p>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-6 py-4 rounded-lg">
              <p className="text-sm">
                <strong>Tip:</strong> For growing children, we recommend sizing up if your child is between sizes. This allows room for growth and ensures longer wear.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Baby Size Chart */}
      <section className="bg-gray-50 py-16 md:py-24">
        <Container>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Baby Size Chart
            </h2>
            <div className="flex items-center space-x-2 mb-6">
              <Baby className="w-6 h-6 text-yellow-dark" />
              <span className="text-lg font-medium text-gray-700">0-24 months</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-900">Size</th>
                    <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-900">Age</th>
                    <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-900">Weight (lbs)</th>
                    <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-900">Height (in)</th>
                    <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-900">Chest (in)</th>
                    <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-900">Waist (in)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-200 px-4 py-3 font-medium">NB</td>
                    <td className="border border-gray-200 px-4 py-3">Newborn</td>
                    <td className="border border-gray-200 px-4 py-3">5-8</td>
                    <td className="border border-gray-200 px-4 py-3">17-21</td>
                    <td className="border border-gray-200 px-4 py-3">15-16</td>
                    <td className="border border-gray-200 px-4 py-3">15-16</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-200 px-4 py-3 font-medium">0-3M</td>
                    <td className="border border-gray-200 px-4 py-3">0-3 months</td>
                    <td className="border border-gray-200 px-4 py-3">8-12</td>
                    <td className="border border-gray-200 px-4 py-3">21-24</td>
                    <td className="border border-gray-200 px-4 py-3">16-17</td>
                    <td className="border border-gray-200 px-4 py-3">16-17</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-3 font-medium">3-6M</td>
                    <td className="border border-gray-200 px-4 py-3">3-6 months</td>
                    <td className="border border-gray-200 px-4 py-3">12-16</td>
                    <td className="border border-gray-200 px-4 py-3">24-27</td>
                    <td className="border border-gray-200 px-4 py-3">17-18</td>
                    <td className="border border-gray-200 px-4 py-3">17-18</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-200 px-4 py-3 font-medium">6-9M</td>
                    <td className="border border-gray-200 px-4 py-3">6-9 months</td>
                    <td className="border border-gray-200 px-4 py-3">16-20</td>
                    <td className="border border-gray-200 px-4 py-3">27-28</td>
                    <td className="border border-gray-200 px-4 py-3">18-19</td>
                    <td className="border border-gray-200 px-4 py-3">18-19</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-3 font-medium">9-12M</td>
                    <td className="border border-gray-200 px-4 py-3">9-12 months</td>
                    <td className="border border-gray-200 px-4 py-3">20-24</td>
                    <td className="border border-gray-200 px-4 py-3">28-30</td>
                    <td className="border border-gray-200 px-4 py-3">19-20</td>
                    <td className="border border-gray-200 px-4 py-3">19-20</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-200 px-4 py-3 font-medium">12-18M</td>
                    <td className="border border-gray-200 px-4 py-3">12-18 months</td>
                    <td className="border border-gray-200 px-4 py-3">24-28</td>
                    <td className="border border-gray-200 px-4 py-3">30-32</td>
                    <td className="border border-gray-200 px-4 py-3">20-21</td>
                    <td className="border border-gray-200 px-4 py-3">20-21</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-3 font-medium">18-24M</td>
                    <td className="border border-gray-200 px-4 py-3">18-24 months</td>
                    <td className="border border-gray-200 px-4 py-3">28-32</td>
                    <td className="border border-gray-200 px-4 py-3">32-34</td>
                    <td className="border border-gray-200 px-4 py-3">21-22</td>
                    <td className="border border-gray-200 px-4 py-3">21-22</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </Container>
      </section>

      {/* Toddler Size Chart */}
      <section className="py-16 md:py-24">
        <Container>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Toddler Size Chart
            </h2>
            <div className="flex items-center space-x-2 mb-6">
              <Baby className="w-6 h-6 text-yellow-dark" />
              <span className="text-lg font-medium text-gray-700">2T-5T</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-900">Size</th>
                    <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-900">Age</th>
                    <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-900">Weight (lbs)</th>
                    <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-900">Height (in)</th>
                    <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-900">Chest (in)</th>
                    <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-900">Waist (in)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-200 px-4 py-3 font-medium">2T</td>
                    <td className="border border-gray-200 px-4 py-3">2 years</td>
                    <td className="border border-gray-200 px-4 py-3">26-30</td>
                    <td className="border border-gray-200 px-4 py-3">34-36</td>
                    <td className="border border-gray-200 px-4 py-3">21-22</td>
                    <td className="border border-gray-200 px-4 py-3">21-22</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-200 px-4 py-3 font-medium">3T</td>
                    <td className="border border-gray-200 px-4 py-3">3 years</td>
                    <td className="border border-gray-200 px-4 py-3">30-34</td>
                    <td className="border border-gray-200 px-4 py-3">36-38</td>
                    <td className="border border-gray-200 px-4 py-3">22-23</td>
                    <td className="border border-gray-200 px-4 py-3">22-23</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-3 font-medium">4T</td>
                    <td className="border border-gray-200 px-4 py-3">4 years</td>
                    <td className="border border-gray-200 px-4 py-3">34-38</td>
                    <td className="border border-gray-200 px-4 py-3">38-40</td>
                    <td className="border border-gray-200 px-4 py-3">23-24</td>
                    <td className="border border-gray-200 px-4 py-3">23-24</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-200 px-4 py-3 font-medium">5T</td>
                    <td className="border border-gray-200 px-4 py-3">5 years</td>
                    <td className="border border-gray-200 px-4 py-3">38-42</td>
                    <td className="border border-gray-200 px-4 py-3">40-42</td>
                    <td className="border border-gray-200 px-4 py-3">24-25</td>
                    <td className="border border-gray-200 px-4 py-3">24-25</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </Container>
      </section>

      {/* Kids Size Chart */}
      <section className="bg-gray-50 py-16 md:py-24">
        <Container>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Kids Size Chart
            </h2>
            <div className="flex items-center space-x-2 mb-6">
              <Baby className="w-6 h-6 text-yellow-dark" />
              <span className="text-lg font-medium text-gray-700">4-14 years</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-900">Size</th>
                    <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-900">Age</th>
                    <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-900">Weight (lbs)</th>
                    <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-900">Height (in)</th>
                    <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-900">Chest (in)</th>
                    <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-900">Waist (in)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-200 px-4 py-3 font-medium">XS</td>
                    <td className="border border-gray-200 px-4 py-3">4-5 years</td>
                    <td className="border border-gray-200 px-4 py-3">38-44</td>
                    <td className="border border-gray-200 px-4 py-3">41-44</td>
                    <td className="border border-gray-200 px-4 py-3">24-25</td>
                    <td className="border border-gray-200 px-4 py-3">23-24</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-200 px-4 py-3 font-medium">S</td>
                    <td className="border border-gray-200 px-4 py-3">6-7 years</td>
                    <td className="border border-gray-200 px-4 py-3">44-52</td>
                    <td className="border border-gray-200 px-4 py-3">45-48</td>
                    <td className="border border-gray-200 px-4 py-3">25-26</td>
                    <td className="border border-gray-200 px-4 py-3">24-25</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-3 font-medium">M</td>
                    <td className="border border-gray-200 px-4 py-3">8-9 years</td>
                    <td className="border border-gray-200 px-4 py-3">52-62</td>
                    <td className="border border-gray-200 px-4 py-3">49-52</td>
                    <td className="border border-gray-200 px-4 py-3">26-27</td>
                    <td className="border border-gray-200 px-4 py-3">25-26</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-200 px-4 py-3 font-medium">L</td>
                    <td className="border border-gray-200 px-4 py-3">10-11 years</td>
                    <td className="border border-gray-200 px-4 py-3">62-74</td>
                    <td className="border border-gray-200 px-4 py-3">53-56</td>
                    <td className="border border-gray-200 px-4 py-3">27-28</td>
                    <td className="border border-gray-200 px-4 py-3">26-27</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-3 font-medium">XL</td>
                    <td className="border border-gray-200 px-4 py-3">12-13 years</td>
                    <td className="border border-gray-200 px-4 py-3">74-88</td>
                    <td className="border border-gray-200 px-4 py-3">57-60</td>
                    <td className="border border-gray-200 px-4 py-3">28-29</td>
                    <td className="border border-gray-200 px-4 py-3">27-28</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-200 px-4 py-3 font-medium">XXL</td>
                    <td className="border border-gray-200 px-4 py-3">14+ years</td>
                    <td className="border border-gray-200 px-4 py-3">88-100+</td>
                    <td className="border border-gray-200 px-4 py-3">61+</td>
                    <td className="border border-gray-200 px-4 py-3">29-30</td>
                    <td className="border border-gray-200 px-4 py-3">28-29</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </Container>
      </section>

      {/* Shoe Size Chart */}
      <section className="py-16 md:py-24">
        <Container>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Shoe Size Chart
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-900">US Size</th>
                    <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-900">EU Size</th>
                    <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-900">UK Size</th>
                    <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-900">Age</th>
                    <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-900">Foot Length (in)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-200 px-4 py-3 font-medium">0-3</td>
                    <td className="border border-gray-200 px-4 py-3">15-18</td>
                    <td className="border border-gray-200 px-4 py-3">0-2</td>
                    <td className="border border-gray-200 px-4 py-3">0-6 months</td>
                    <td className="border border-gray-200 px-4 py-3">3.5 - 4.5</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-200 px-4 py-3 font-medium">4-5</td>
                    <td className="border border-gray-200 px-4 py-3">19-20</td>
                    <td className="border border-gray-200 px-4 py-3">3-4</td>
                    <td className="border border-gray-200 px-4 py-3">6-12 months</td>
                    <td className="border border-gray-200 px-4 py-3">4.5 - 5.0</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-3 font-medium">6-7</td>
                    <td className="border border-gray-200 px-4 py-3">21-22</td>
                    <td className="border border-gray-200 px-4 py-3">5-6</td>
                    <td className="border border-gray-200 px-4 py-3">12-18 months</td>
                    <td className="border border-gray-200 px-4 py-3">5.0 - 5.5</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-200 px-4 py-3 font-medium">8-9</td>
                    <td className="border border-gray-200 px-4 py-3">24-25</td>
                    <td className="border border-gray-200 px-4 py-3">7-8</td>
                    <td className="border border-gray-200 px-4 py-3">18-24 months</td>
                    <td className="border border-gray-200 px-4 py-3">5.5 - 6.0</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-3 font-medium">10-11</td>
                    <td className="border border-gray-200 px-4 py-3">27-28</td>
                    <td className="border border-gray-200 px-4 py-3">9-10</td>
                    <td className="border border-gray-200 px-4 py-3">2-3 years</td>
                    <td className="border border-gray-200 px-4 py-3">6.0 - 6.5</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-200 px-4 py-3 font-medium">12-13</td>
                    <td className="border border-gray-200 px-4 py-3">30-31</td>
                    <td className="border border-gray-200 px-4 py-3">11-12</td>
                    <td className="border border-gray-200 px-4 py-3">4-5 years</td>
                    <td className="border border-gray-200 px-4 py-3">6.5 - 7.0</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-3 font-medium">1-2</td>
                    <td className="border border-gray-200 px-4 py-3">33-34</td>
                    <td className="border border-gray-200 px-4 py-3">13-1</td>
                    <td className="border border-gray-200 px-4 py-3">6-7 years</td>
                    <td className="border border-gray-200 px-4 py-3">7.0 - 7.5</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-200 px-4 py-3 font-medium">3-4</td>
                    <td className="border border-gray-200 px-4 py-3">35-36</td>
                    <td className="border border-gray-200 px-4 py-3">2-3</td>
                    <td className="border border-gray-200 px-4 py-3">8-9 years</td>
                    <td className="border border-gray-200 px-4 py-3">7.5 - 8.0</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-3 font-medium">5-6</td>
                    <td className="border border-gray-200 px-4 py-3">37-38</td>
                    <td className="border border-gray-200 px-4 py-3">4-5</td>
                    <td className="border border-gray-200 px-4 py-3">10-12 years</td>
                    <td className="border border-gray-200 px-4 py-3">8.0 - 8.5</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </Container>
      </section>

      {/* Tips */}
      <section className="bg-yellow py-16 md:py-24">
        <Container>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Sizing Tips
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white/20 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Growing Room
                </h3>
                <p className="text-gray-900">
                  For growing children, consider sizing up to allow for growth spurts. This is especially important for shoes and outerwear.
                </p>
              </div>
              <div className="bg-white/20 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Layering
                </h3>
                <p className="text-gray-900">
                  If your child will be wearing layers underneath, consider sizing up for a comfortable fit.
                </p>
              </div>
              <div className="bg-white/20 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Fit Preferences
                </h3>
                <p className="text-gray-900">
                  Some styles are designed for a relaxed fit, while others are more fitted. Check individual product descriptions for fit notes.
                </p>
              </div>
              <div className="bg-white/20 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Need Help?
                </h3>
                <p className="text-gray-900">
                  If you're unsure about sizing, our customer service team is happy to help. Contact us at support@kidspetite.com.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
