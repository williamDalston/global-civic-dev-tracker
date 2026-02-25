import type { Metadata } from 'next';
import { SITE_NAME } from '@/lib/config/constants';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: `Privacy Policy for ${SITE_NAME} - Learn how we collect, use, and protect your information.`,
};

export default function PrivacyPage() {
  const lastUpdated = 'February 24, 2026';
  const contactEmail = 'info@alstonanalytics.com';

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold tracking-tight text-foreground">
        Privacy Policy
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: {lastUpdated}
      </p>

      <div className="prose prose-invert mt-10 max-w-none">
        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-foreground">1. Introduction</h2>
          <p className="mt-4 text-muted-foreground">
            {SITE_NAME} (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. 
            This Privacy Policy explains how we collect, use, disclose, and safeguard your 
            information when you visit our website and use our services.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-foreground">2. Information We Collect</h2>
          
          <h3 className="mt-6 text-xl font-medium text-foreground">2.1 Information You Provide</h3>
          <p className="mt-2 text-muted-foreground">
            When you use our lead generation forms or contact us, we may collect:
          </p>
          <ul className="mt-2 list-disc pl-6 text-muted-foreground">
            <li>Name</li>
            <li>Email address</li>
            <li>Phone number</li>
            <li>Project details and messages</li>
            <li>Location information (city, neighborhood)</li>
          </ul>

          <h3 className="mt-6 text-xl font-medium text-foreground">2.2 Automatically Collected Information</h3>
          <p className="mt-2 text-muted-foreground">
            When you visit our website, we automatically collect certain information, including:
          </p>
          <ul className="mt-2 list-disc pl-6 text-muted-foreground">
            <li>IP address</li>
            <li>Browser type and version</li>
            <li>Device information</li>
            <li>Pages visited and time spent</li>
            <li>Referring website</li>
            <li>UTM parameters for marketing attribution</li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-foreground">3. How We Use Your Information</h2>
          <p className="mt-4 text-muted-foreground">We use the information we collect to:</p>
          <ul className="mt-2 list-disc pl-6 text-muted-foreground">
            <li>Connect you with local contractors and service providers</li>
            <li>Respond to your inquiries and provide customer support</li>
            <li>Improve our website and services</li>
            <li>Send you relevant updates about permits in your area (with your consent)</li>
            <li>Analyze usage patterns to enhance user experience</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-foreground">4. Information Sharing</h2>
          <p className="mt-4 text-muted-foreground">
            We may share your information with:
          </p>
          <ul className="mt-2 list-disc pl-6 text-muted-foreground">
            <li>
              <strong>Contractors and Service Providers:</strong> When you submit a lead form, 
              your contact information may be shared with relevant local contractors who can 
              assist with your project.
            </li>
            <li>
              <strong>Service Providers:</strong> Third-party vendors who help us operate our 
              website (hosting, analytics, email delivery).
            </li>
            <li>
              <strong>Legal Requirements:</strong> When required by law or to protect our rights.
            </li>
          </ul>
          <p className="mt-4 text-muted-foreground">
            We do not sell your personal information to third parties.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-foreground">5. Data Sources</h2>
          <p className="mt-4 text-muted-foreground">
            The building permit data displayed on our website is sourced from publicly available 
            government open data portals. This data is provided by municipal governments and is 
            already in the public domain. We aggregate, normalize, and present this data for 
            easier access and analysis.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-foreground">6. Cookies and Tracking</h2>
          <p className="mt-4 text-muted-foreground">
            We use cookies and similar tracking technologies to:
          </p>
          <ul className="mt-2 list-disc pl-6 text-muted-foreground">
            <li>Remember your preferences</li>
            <li>Analyze website traffic and usage</li>
            <li>Track marketing campaign effectiveness</li>
          </ul>
          <p className="mt-4 text-muted-foreground">
            You can control cookies through your browser settings. Disabling cookies may affect 
            some website functionality.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-foreground">7. Data Security</h2>
          <p className="mt-4 text-muted-foreground">
            We implement appropriate technical and organizational measures to protect your 
            personal information against unauthorized access, alteration, disclosure, or 
            destruction. However, no method of transmission over the Internet is 100% secure.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-foreground">8. Data Retention</h2>
          <p className="mt-4 text-muted-foreground">
            We retain your personal information for as long as necessary to fulfill the purposes 
            outlined in this Privacy Policy, unless a longer retention period is required by law. 
            Lead information is typically retained for 2 years unless you request deletion.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-foreground">9. Your Rights</h2>
          <p className="mt-4 text-muted-foreground">
            Depending on your location, you may have the following rights:
          </p>
          <ul className="mt-2 list-disc pl-6 text-muted-foreground">
            <li>Access your personal information</li>
            <li>Correct inaccurate information</li>
            <li>Request deletion of your information</li>
            <li>Object to or restrict processing</li>
            <li>Data portability</li>
            <li>Withdraw consent</li>
          </ul>
          <p className="mt-4 text-muted-foreground">
            To exercise these rights, please contact us at{' '}
            <a href={`mailto:${contactEmail}`} className="text-primary hover:underline">
              {contactEmail}
            </a>.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-foreground">10. California Privacy Rights (CCPA)</h2>
          <p className="mt-4 text-muted-foreground">
            California residents have additional rights under the California Consumer Privacy Act, 
            including the right to know what personal information is collected, request deletion, 
            and opt out of the sale of personal information. We do not sell personal information.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-foreground">11. International Users (GDPR)</h2>
          <p className="mt-4 text-muted-foreground">
            If you are located in the European Economic Area (EEA), we process your personal data 
            based on legitimate interests, contract performance, or your consent. You have the 
            right to lodge a complaint with your local data protection authority.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-foreground">12. Children&apos;s Privacy</h2>
          <p className="mt-4 text-muted-foreground">
            Our services are not directed to individuals under 18. We do not knowingly collect 
            personal information from children. If we become aware that we have collected 
            information from a child, we will delete it promptly.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-foreground">13. Changes to This Policy</h2>
          <p className="mt-4 text-muted-foreground">
            We may update this Privacy Policy from time to time. We will notify you of any 
            changes by posting the new Privacy Policy on this page and updating the 
            &quot;Last updated&quot; date.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-foreground">14. Contact Us</h2>
          <p className="mt-4 text-muted-foreground">
            If you have questions about this Privacy Policy or our data practices, please 
            contact us at:
          </p>
          <p className="mt-4 text-muted-foreground">
            <strong>Email:</strong>{' '}
            <a href={`mailto:${contactEmail}`} className="text-primary hover:underline">
              {contactEmail}
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
