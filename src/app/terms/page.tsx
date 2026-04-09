export default function TermsPage() {
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? null;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <h1 style={{ color: 'var(--primary-blue)', marginBottom: '0.5rem', fontSize: '2rem' }}>Terms and Conditions</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
        Effective date: April 2026 &mdash; Version 1.0
      </p>

      <div style={{ lineHeight: '1.8', color: 'var(--foreground)' }}>
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '0.75rem', color: 'var(--primary-blue)' }}>1. Introduction</h2>
          <p>
            STAR-LINK is a community-driven collaboration hub designed to complement and enrich e-STAR.ph,
            operated in support of the DOST-SEI STEM Teachers Action Research program. By accessing and
            using this platform, you agree to be bound by these Terms and Conditions in full.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '0.75rem', color: 'var(--primary-blue)' }}>2. User Responsibilities</h2>
          <p>As a registered user of STAR-LINK, you agree to:</p>
          <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem', marginBottom: '1rem' }}>
            <li>Provide accurate and truthful information during registration and in all subsequent interactions</li>
            <li>Maintain the confidentiality of your account credentials and notify administrators of any suspected unauthorised access</li>
            <li>Use the platform only for legitimate educational and professional purposes aligned with the STAR program</li>
            <li>Respect the intellectual property rights of all content contributors</li>
            <li>Refrain from posting harmful, offensive, discriminatory, or misleading content</li>
          </ul>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '0.75rem', color: 'var(--primary-blue)' }}>3. Content Sharing and Licensing</h2>
          <p>
            When you upload or share content on STAR-LINK, you grant the platform and other registered educators
            a non-exclusive, royalty-free licence to use, reproduce, and distribute your work for educational
            purposes within the Philippines. You retain ownership of all original content you create.
          </p>
          <p style={{ marginTop: '0.75rem' }}>
            All uploaded documents are subject to moderation review prior to public availability. STAR-LINK
            reserves the right to reject or remove content that does not meet community or legal standards.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '0.75rem', color: 'var(--primary-blue)' }}>4. Privacy and Data Protection</h2>
          <p>
            Your personal information is collected, stored, and processed in accordance with the Philippine
            Data Privacy Act of 2012 (Republic Act No. 10173) and its implementing rules and regulations.
            Data is used exclusively for account management, community facilitation, and programme analytics.
          </p>
          <p style={{ marginTop: '0.75rem' }}>
            You may request access to, correction of, or deletion of your personal data at any time by
            contacting the platform administrator. Profile data marked for anonymisation will be de-identified
            in all analytics outputs.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '0.75rem', color: 'var(--primary-blue)' }}>5. Moderation and Enforcement</h2>
          <p>
            STAR-LINK operates a content moderation system. All forum posts and uploaded resources are reviewed
            by designated administrators before public publication. Users found to violate these Terms may have
            their content removed and their accounts suspended or permanently revoked without prior notice.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '0.75rem', color: 'var(--primary-blue)' }}>6. Limitation of Liability</h2>
          <p>
            STAR-LINK and its operators are not liable for any indirect, incidental, or consequential damages
            arising from your use of the platform or reliance on content shared by other users. The platform
            is provided &ldquo;as is&rdquo; without warranties of any kind, express or implied.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '0.75rem', color: 'var(--primary-blue)' }}>7. Changes to These Terms</h2>
          <p>
            STAR-LINK reserves the right to modify these Terms and Conditions at any time. Registered users
            will be notified of material changes and will be required to re-accept the updated terms upon
            their next login. Continued use after notification constitutes acceptance of the revised terms.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '0.75rem', color: 'var(--primary-blue)' }}>8. Contact</h2>
          <p>
            For questions, data access requests, or concerns regarding these Terms and Conditions, please
            contact the STAR-LINK platform administrator:
          </p>
          {contactEmail ? (
            <p style={{ marginTop: '0.5rem' }}>
              <a href={`mailto:${contactEmail}`} style={{ color: 'var(--primary-blue)' }}>
                {contactEmail}
              </a>
            </p>
          ) : (
            <p style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>
              Please use the contact information provided by your regional STAR programme coordinator.
            </p>
          )}
        </section>

        <div
          style={{
            marginTop: '3rem',
            padding: '1rem 1.25rem',
            background: 'var(--surface)',
            borderRadius: 'var(--radius-md)',
            borderLeft: '4px solid var(--primary-blue)',
          }}
        >
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>
            By registering for or using STAR-LINK, you acknowledge that you have read, understood, and
            agree to these Terms and Conditions in their entirety.
          </p>
        </div>
      </div>
    </div>
  );
}
