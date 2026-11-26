import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import styles from './Legal.module.css';

export function PrivacyPage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link to="/" className={styles.backLink}>
          <ArrowLeft size={16} /> Back to Home
        </Link>
        <h1 className={styles.title}>Privacy Policy</h1>
        <p className={styles.meta}>Effective Date: January 1, 2026 • Version 2.0</p>
      </header>

      <div className={`${styles.content} document-body`}>
        <section className={styles.section}>
          <h2>1. Information We Collect</h2>
          <p>
            We collect account registration data (name, email, organization), document metadata, counterparty contact details, IP addresses, browser user agent strings, and audit timestamps required to establish electronic signature evidentiary records.
          </p>
        </section>

        <section className={styles.section}>
          <h2>2. How We Use Counterparty Data</h2>
          <p>
            Signer emails, IP addresses, and signature image data are collected solely for the purpose of executing requested agreements, delivering notifications, and embedding tamper-evident audit trail certificates. We do not sell or monetize contract contents or counterparty records.
          </p>
        </section>

        <section className={styles.section}>
          <h2>3. Data Security & Storage</h2>
          <p>
            Customer agreements and attachments are stored in S3-compatible private object storage with server-side encryption (AES-256). All web and API traffic is encrypted via TLS 1.3.
          </p>
        </section>

        <section className={styles.section}>
          <h2>4. Your Data Rights</h2>
          <p>
            Under applicable GDPR and CCPA regulations, organization owners may request full data export, retention adjustment, or deletion of workspace data and associated audit history subject to legal retention obligations.
          </p>
        </section>
      </div>
    </div>
  );
}
