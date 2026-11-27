import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import styles from './Legal.module.css';

export function TermsPage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link to="/" className={styles.backLink}>
          <ArrowLeft size={16} /> Back to Home
        </Link>
        <h1 className={styles.title}>Terms of Service</h1>
        <p className={styles.meta}>Effective Date: January 1, 2026 • Version 2.0</p>
      </header>

      <div className={`${styles.content} document-body`}>
        <div className={styles.noticeBox}>
          <strong>Simple Electronic Signatures (SES) Notice:</strong>
          <span>
            Agree2Met provides simple electronic signature capabilities and tamper-evident audit logs designed to support legal enforceability under applicable laws. Agree2Met does not provide Qualified Electronic Signatures (QES) or government-certified digital certificate tokens. Legal enforceability depends upon your jurisdiction and specific agreement type.
          </span>
        </div>

        <section className={styles.section}>
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using the Agree2Met SaaS platform (&ldquo;Service&rdquo;), you agree to be bound by these Terms of Service. If you are entering into these terms on behalf of a company or other legal entity, you represent that you possess lawful authority to bind such entity.
          </p>
        </section>

        <section className={styles.section}>
          <h2>2. Description of Service & Electronic Transactions</h2>
          <p>
            Agree2Met facilitates digital agreement authoring, clause governance, counterparty invitations, electronic signing, and cryptographic audit trail generation. You acknowledge that applying your electronic signature or clicking consent indicates intent to sign electronically.
          </p>
        </section>

        <section className={styles.section}>
          <h2>3. Tamper-Evident Audit Records</h2>
          <p>
            The platform computes sequential SHA-256 cryptographic hashes for audit trail records. While these records demonstrate chain-of-custody and tamper-evidence, you remain responsible for maintaining your own definitive business records and verifying jurisdictional prerequisites.
          </p>
        </section>

        <section className={styles.section}>
          <h2>4. AI Assistant Capabilities Disclaimer</h2>
          <p>
            Agree2Met AI Copilot provides automated drafting assistance, clause suggestions, and informational contract risk summaries. Agree2Met AI does not provide legal advice, legal representation, or formal legal opinions. You are advised to have all agreements reviewed by qualified legal counsel.
          </p>
        </section>

        <section className={styles.section}>
          <h2>5. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by applicable law, in no event shall Agree2Met Inc. be liable for any indirect, incidental, punitive, or consequential damages resulting from the use or inability to enforce any agreement generated on the platform.
          </p>
        </section>
      </div>
    </div>
  );
}
