export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-4xl font-bold text-neutral-dark mb-8">Privacy Policy</h1>
      <div className="prose prose-neutral max-w-none space-y-6 text-neutral leading-relaxed">
        <p className="text-sm text-neutral">Last updated: January 15, 2026</p>

        <section>
          <h2 className="text-xl font-semibold text-neutral-dark mb-3">1. Information We Collect</h2>
          <p>
            When you use ShopNova, we collect information you provide directly — such as your name, email address, phone number, and payment details during checkout. We also automatically collect browsing data including pages viewed, products clicked, and search queries to power our recommendation engine.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-neutral-dark mb-3">2. How We Use Your Information</h2>
          <p>We use your information to:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Process and fulfill your orders</li>
            <li>Provide personalized product recommendations</li>
            <li>Power our AI Shopping Assistant with relevant context</li>
            <li>Send order updates and promotional communications (with your consent)</li>
            <li>Improve our platform and customer experience</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-neutral-dark mb-3">3. AI and Data Processing</h2>
          <p>
            Our AI features analyze your browsing and purchase history to generate personalized recommendations. Conversation data with our AI assistant is stored to maintain context across sessions. You can request deletion of this data at any time by contacting support@shopnova.com.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-neutral-dark mb-3">4. Data Sharing</h2>
          <p>
            We do not sell your personal information. We share data only with trusted service providers who assist in operating our platform (payment processors, shipping carriers, cloud hosting) under strict confidentiality agreements.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-neutral-dark mb-3">5. Security</h2>
          <p>
            We implement industry-standard security measures including SSL/TLS encryption, secure password hashing, and regular security audits to protect your data.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-neutral-dark mb-3">6. Your Rights</h2>
          <p>
            You have the right to access, correct, or delete your personal data. You may also opt out of marketing communications at any time. Contact us at support@shopnova.com to exercise these rights.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-neutral-dark mb-3">7. Contact</h2>
          <p>
            For privacy-related inquiries, contact our Data Protection Officer at privacy@shopnova.com or write to us at 742 Evergreen Terrace, Springfield, IL 62701.
          </p>
        </section>
      </div>
    </div>
  );
}
