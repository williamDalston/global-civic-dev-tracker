import type { Metadata } from 'next';
import { SITE_NAME } from '@/lib/config/constants';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: `Terms of Service for ${SITE_NAME} - Read our terms and conditions for using our services.`,
};

export default function TermsPage() {
  const lastUpdated = 'February 24, 2026';
  const contactEmail = 'info@alstonanalytics.com';

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold tracking-tight text-foreground">
        Terms of Service
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: {lastUpdated}
      </p>

      <div className="prose prose-invert mt-10 max-w-none">
        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-foreground">1. Acceptance of Terms</h2>
          <p className="mt-4 text-muted-foreground">
            By accessing or using {SITE_NAME} (&quot;the Service&quot;), you agree to be bound by these 
            Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, please do not use 
            the Service.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-foreground">2. Description of Service</h2>
          <p className="mt-4 text-muted-foreground">
            {SITE_NAME} provides a platform that aggregates and displays publicly available 
            building permit data from government open data portals. The Service also facilitates 
            connections between users seeking contractors and local service providers.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-foreground">3. Data Accuracy and Disclaimer</h2>
          <p className="mt-4 text-muted-foreground">
            The building permit data displayed on our website is sourced from public government 
            databases. While we strive to present accurate and up-to-date information:
          </p>
          <ul className="mt-2 list-disc pl-6 text-muted-foreground">
            <li>
              We do not guarantee the accuracy, completeness, or timeliness of any data displayed.
            </li>
            <li>
              Data may contain errors from the original source or from our processing.
            </li>
            <li>
              Permit statuses and details may change after we retrieve the data.
            </li>
            <li>
              You should verify all information with the relevant government authority before 
              making any decisions.
            </li>
          </ul>
          <p className="mt-4 text-muted-foreground font-semibold">
            THE SERVICE IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-foreground">4. AI-Generated Content</h2>
          <p className="mt-4 text-muted-foreground">
            Some content on our website, including permit narratives and descriptions, is 
            generated using artificial intelligence. This AI-generated content:
          </p>
          <ul className="mt-2 list-disc pl-6 text-muted-foreground">
            <li>Is provided for informational purposes only</li>
            <li>May contain inaccuracies or errors</li>
            <li>Should not be relied upon as professional advice</li>
            <li>Does not constitute legal, financial, or construction advice</li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-foreground">5. Lead Generation Services</h2>
          <p className="mt-4 text-muted-foreground">
            When you submit a contact form or request quotes through our Service:
          </p>
          <ul className="mt-2 list-disc pl-6 text-muted-foreground">
            <li>
              Your information may be shared with third-party contractors and service providers.
            </li>
            <li>
              We do not guarantee the quality, reliability, or availability of any contractor.
            </li>
            <li>
              Any agreement you enter into with a contractor is solely between you and that contractor.
            </li>
            <li>
              We are not responsible for any disputes, damages, or issues arising from your 
              interactions with contractors.
            </li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-foreground">6. User Conduct</h2>
          <p className="mt-4 text-muted-foreground">You agree not to:</p>
          <ul className="mt-2 list-disc pl-6 text-muted-foreground">
            <li>Use the Service for any unlawful purpose</li>
            <li>Attempt to gain unauthorized access to our systems</li>
            <li>Scrape, crawl, or harvest data in violation of our robots.txt</li>
            <li>Interfere with or disrupt the Service</li>
            <li>Submit false or misleading information</li>
            <li>Use automated systems to access the Service without permission</li>
            <li>Impersonate any person or entity</li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-foreground">7. Intellectual Property</h2>
          <p className="mt-4 text-muted-foreground">
            The Service&apos;s design, layout, and original content are owned by {SITE_NAME} and 
            protected by intellectual property laws. The underlying permit data is sourced from 
            public government databases and remains in the public domain.
          </p>
          <p className="mt-4 text-muted-foreground">
            You may not reproduce, distribute, or create derivative works from our proprietary 
            content without written permission.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-foreground">8. API and Data Access</h2>
          <p className="mt-4 text-muted-foreground">
            Access to our API or bulk data exports may be subject to additional terms and fees. 
            Unauthorized automated access to our Service is prohibited.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-foreground">9. Limitation of Liability</h2>
          <p className="mt-4 text-muted-foreground">
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, {SITE_NAME.toUpperCase()} AND ITS AFFILIATES, 
            OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR:
          </p>
          <ul className="mt-2 list-disc pl-6 text-muted-foreground">
            <li>Any indirect, incidental, special, consequential, or punitive damages</li>
            <li>Loss of profits, data, or business opportunities</li>
            <li>Damages arising from your use of or inability to use the Service</li>
            <li>Damages arising from any contractor or third-party interactions</li>
            <li>Damages arising from inaccurate or incomplete data</li>
          </ul>
          <p className="mt-4 text-muted-foreground">
            Our total liability shall not exceed the amount you paid us (if any) in the 12 months 
            preceding the claim.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-foreground">10. Indemnification</h2>
          <p className="mt-4 text-muted-foreground">
            You agree to indemnify and hold harmless {SITE_NAME} and its affiliates from any 
            claims, damages, losses, or expenses arising from your use of the Service or 
            violation of these Terms.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-foreground">11. Third-Party Links</h2>
          <p className="mt-4 text-muted-foreground">
            The Service may contain links to third-party websites. We are not responsible for 
            the content, privacy practices, or terms of any third-party sites.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-foreground">12. Modifications to Service</h2>
          <p className="mt-4 text-muted-foreground">
            We reserve the right to modify, suspend, or discontinue the Service at any time 
            without notice. We shall not be liable to you or any third party for any 
            modification, suspension, or discontinuation.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-foreground">13. Changes to Terms</h2>
          <p className="mt-4 text-muted-foreground">
            We may update these Terms from time to time. We will notify you of significant 
            changes by posting the new Terms on this page. Your continued use of the Service 
            after changes constitutes acceptance of the new Terms.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-foreground">14. Governing Law</h2>
          <p className="mt-4 text-muted-foreground">
            These Terms shall be governed by and construed in accordance with the laws of the 
            State of Delaware, United States, without regard to its conflict of law provisions.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-foreground">15. Dispute Resolution</h2>
          <p className="mt-4 text-muted-foreground">
            Any disputes arising from these Terms or your use of the Service shall be resolved 
            through binding arbitration in accordance with the rules of the American Arbitration 
            Association. You waive any right to participate in a class action lawsuit.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-foreground">16. Severability</h2>
          <p className="mt-4 text-muted-foreground">
            If any provision of these Terms is found to be unenforceable, the remaining 
            provisions shall continue in full force and effect.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-foreground">17. Contact Us</h2>
          <p className="mt-4 text-muted-foreground">
            If you have questions about these Terms, please contact us at:
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
