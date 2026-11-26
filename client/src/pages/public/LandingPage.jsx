import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  FileCheck2,
  Lock,
  Layers,
  Sparkles,
  ArrowRight,
  ChevronDown,
  CheckCircle,
  Building2,
  Clock,
  Sun,
  Moon,
} from 'lucide-react';
import { Logo } from '../../components/common/Logo';
import { Button } from '../../components/ui/Button/Button';
import { Card } from '../../components/ui/DataDisplay/Card';
import { StatusBadge } from '../../components/ui/DataDisplay/StatusBadge';
import { useTheme } from '../../context/ThemeContext';
import styles from './LandingPage.module.css';

export function LandingPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      q: 'Are electronic signatures executed in Agree2Met legally binding?',
      a: 'Agree2Met is designed to support legal enforceability under applicable Simple Electronic Signature (SES) frameworks. Enforceability depends on jurisdiction, document type, and mutual consent. Agree2Met does not provide Qualified Electronic Signatures (QES). Consult qualified legal counsel for specific jurisdictional compliance.',
    },
    {
      q: 'How does the tamper-evident audit trail work?',
      a: 'Every mutation, status transition, signature, and approval creates an audit record linked to the previous record using standard SHA-256 cryptographic hashing. Any subsequent alteration to document text or history breaks the hash chain, immediately alerting parties.',
    },
    {
      q: 'Can I export my agreements and audit certificates?',
      a: 'Yes. Every executed agreement can be downloaded with its full cryptographic audit trail, timestamps, signer IPs, and execution certificate in PDF and JSON formats at any time.',
    },
    {
      q: 'How is counterparty data protected?',
      a: 'All data is isolated per organization workspace. Access is governed by strict Role-Based Access Control (RBAC), and documents are encrypted in transit via TLS 1.3 and at rest with AES-256.',
    },
    {
      q: 'What is the difference between simple and qualified signatures?',
      a: 'Simple Electronic Signatures (SES) rely on intent, email authentication, and tamper-evident audit logs. Qualified signatures (QES) require government-certified cryptographic hardware tokens. Agree2Met focuses on streamlined, high-speed commercial agreements using robust SES.',
    },
    {
      q: 'Can I test the platform without setting up an account?',
      a: 'Yes! Click "Explore Live Demo" above to enter our fully functional, pre-seeded sandbox loaded with 40+ contracts, AI contract drafting, and cryptographic verification.',
    },
  ];

  return (
    <div className={styles.landing}>
      {/* Top Navbar */}
      <header className={styles.navbar}>
        <div className={styles.navContainer}>
          <Logo size="md" />
          <nav className={styles.navLinks}>
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#security">Security & Legal</a>
            <a href="#faq">FAQ</a>
            <Link to="/status" className={styles.statusLink}>
              System Status
            </Link>
          </nav>
          <div className={styles.navActions}>
            <button
              type="button"
              className={styles.themeToggle}
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Button variant="ghost" onClick={() => navigate('/login')}>
              Sign In
            </Button>
            <Button variant="primary" onClick={() => navigate('/app/dashboard')}>
              Explore Live Demo
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.heroContainer}>
          <div className={styles.heroBadge}>
            <Sparkles size={14} className={styles.badgeSparkle} />
            <span>Modern Agreement Management SaaS</span>
          </div>

          <h1 className={styles.heroTitle}>
            Author, Sign & Verify Digital Contracts with{' '}
            <span className={styles.gradientText}>Cryptographic Proof</span>
          </h1>

          <p className={styles.heroSubtitle}>
            Agree2Met simplifies the entire contract lifecycle for enterprises, founders, and legal teams.
            Featuring 12 lifecycle stages, multi-party electronic signatures, and tamper-evident SHA-256 audit chains.
          </p>

          <div className={styles.heroCtaRow}>
            <Button
              size="lg"
              variant="primary"
              rightIcon={ArrowRight}
              onClick={() => navigate('/app/dashboard')}
            >
              Launch Live Demo Workspace
            </Button>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate('/register')}
            >
              Create Free Account
            </Button>
          </div>

          {/* Social Proof Stats */}
          <div className={styles.proofStats}>
            <div className={styles.statItem}>
              <strong className={styles.statValue}>40+</strong>
              <span className={styles.statLabel}>Pre-loaded Enterprise Contracts</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <strong className={styles.statValue}>100%</strong>
              <span className={styles.statLabel}>SHA-256 Hash Verified Trails</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <strong className={styles.statValue}>12 States</strong>
              <span className={styles.statLabel}>Full Agreement Lifecycle Engine</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <strong className={styles.statValue}>0 Lock-In</strong>
              <span className={styles.statLabel}>Export Execution PDF & JSON Anytime</span>
            </div>
          </div>

          {/* Interactive Preview Mock Card */}
          <div className={styles.previewWrapper}>
            <div className={styles.previewCard}>
              <div className={styles.previewHeader}>
                <div className={styles.previewHeaderLeft}>
                  <span className={styles.previewDocNumber}>AGR-2026-001</span>
                  <h3 className={styles.previewTitle}>Series B Preferred Stock Purchase Agreement</h3>
                </div>
                <div className={styles.previewHeaderRight}>
                  <StatusBadge status="active" />
                  <span className={styles.previewValue}>$15,000,000 USD</span>
                </div>
              </div>

              <div className={styles.previewBody}>
                <div className={styles.previewSigners}>
                  <span className={styles.previewSectionTitle}>Counterparty Execution</span>
                  <div className={styles.signersList}>
                    <div className={styles.signerItem}>
                      <CheckCircle size={16} className={styles.checkIcon} />
                      <div>
                        <strong>Alex Rivera (General Counsel)</strong>
                        <span>Signed • IP: 198.51.100.44 • Hash: 4b8e...12a</span>
                      </div>
                    </div>
                    <div className={styles.signerItem}>
                      <CheckCircle size={16} className={styles.checkIcon} />
                      <div>
                        <strong>Marcus Sterling (Lead Investor)</strong>
                        <span>Signed • IP: 54.215.12.98 • Hash: 9c2f...81b</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.previewAuditSnippet}>
                  <span className={styles.previewSectionTitle}>Cryptographic Hash Chain (SHA-256)</span>
                  <div className={styles.auditCode}>
                    <span>GENESIS: 0000000000000000000000000000000000000000000000000000000000000000</span>
                    <span>RECORD #1: 7a3c89b21f00... [AGREEMENT_CREATED] ✓ VALID</span>
                    <span>RECORD #2: 9e10ff42c88d... [SIGNING_INVITATIONS_SENT] ✓ VALID</span>
                    <span>RECORD #3: 3b4018e69d2a... [EXECUTION_FINALIZED] ✓ CHAIN INTACT</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className={styles.featuresSection}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionHeading}>Engineered for Real Commercial Workflows</h2>
            <p className={styles.sectionSubheading}>
              Every capability needed to govern digital agreements with precision, speed, and integrity.
            </p>
          </div>

          <div className={styles.featuresGrid}>
            <Card className={styles.featureCard}>
              <div className={styles.featureIconWrapper}>
                <Layers size={24} className={styles.featureIcon} />
              </div>
              <h3 className={styles.featureTitle}>12-State Lifecycle State Machine</h3>
              <p className={styles.featureDesc}>
                Enforce rigorous transition rules from Draft and In Review through Signatures, Active execution, Renewals, and Dispute management.
              </p>
            </Card>

            <Card className={styles.featureCard}>
              <div className={styles.featureIconWrapper}>
                <Lock size={24} className={styles.featureIcon} />
              </div>
              <h3 className={styles.featureTitle}>Tamper-Evident SHA-256 Audit Chains</h3>
              <p className={styles.featureDesc}>
                Each state transition, signature, and revision is cryptographically hashed with its ancestor. In-browser verification flags any alteration instantly.
              </p>
            </Card>

            <Card className={styles.featureCard}>
              <div className={styles.featureIconWrapper}>
                <FileCheck2 size={24} className={styles.featureIcon} />
              </div>
              <h3 className={styles.featureTitle}>Multi-Party Guest Signing Portal</h3>
              <p className={styles.featureDesc}>
                Clean, accessible signing portal for external counterparties. HTML5 canvas drawing, typed script fonts, and image upload with electronic consent capture.
              </p>
            </Card>

            <Card className={styles.featureCard}>
              <div className={styles.featureIconWrapper}>
                <Clock size={24} className={styles.featureIcon} />
              </div>
              <h3 className={styles.featureTitle}>Milestone & Payment Scheduling</h3>
              <p className={styles.featureDesc}>
                Tie contracts to real business milestones. Track payment schedules, invoicing triggers, upcoming renewal windows, and expiration deadlines.
              </p>
            </Card>

            <Card className={styles.featureCard}>
              <div className={styles.featureIconWrapper}>
                <Sparkles size={24} className={styles.featureIcon} />
              </div>
              <h3 className={styles.featureTitle}>AI Legal Drafting Copilot</h3>
              <p className={styles.featureDesc}>
                Rapidly draft customized clauses, assess potential liability risks, and summarize key obligations with embedded disclaimers.
              </p>
            </Card>

            <Card className={styles.featureCard}>
              <div className={styles.featureIconWrapper}>
                <Building2 size={24} className={styles.featureIcon} />
              </div>
              <h3 className={styles.featureTitle}>Multi-Tenant Workspaces & RBAC</h3>
              <p className={styles.featureDesc}>
                Seamlessly toggle between enterprise organizations and personal legal advisory scopes. Enforce Owner, Admin, Member, and Viewer permissions.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Walkthrough */}
      <section id="how-it-works" className={styles.howSection}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionHeading}>Streamlined Contract Lifecycle in 3 Steps</h2>
            <p className={styles.sectionSubheading}>
              From template initiation to execution proof in minutes.
            </p>
          </div>

          <div className={styles.stepsGrid}>
            <div className={styles.stepCard}>
              <div className={styles.stepNumber}>01</div>
              <h3 className={styles.stepTitle}>Author & Customize</h3>
              <p className={styles.stepDesc}>
                Choose from vetted templates or build custom contracts. Drag and reorder clauses, assign variables, and establish payment milestone schedules.
              </p>
            </div>

            <div className={styles.stepCard}>
              <div className={styles.stepNumber}>02</div>
              <h3 className={styles.stepTitle}>Review, Approve & Sign</h3>
              <p className={styles.stepDesc}>
                Route through internal management approval. Dispatched signing invitations allow counterparties to review and sign without creating an account.
              </p>
            </div>

            <div className={styles.stepCard}>
              <div className={styles.stepNumber}>03</div>
              <h3 className={styles.stepTitle}>Govern, Track & Verify</h3>
              <p className={styles.stepDesc}>
                Monitor execution in the calendar, receive renewal reminders, and verify cryptographic chain integrity with one click at any time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Honest Security & Legal Validity Statement */}
      <section id="security" className={styles.securitySection}>
        <div className={styles.container}>
          <div className={styles.securityCard}>
            <div className={styles.securityIcon}>
              <ShieldCheck size={36} />
            </div>
            <div className={styles.securityContent}>
              <h3 className={styles.securityTitle}>Honest Legal & Security Commitment</h3>
              <p className={styles.securityText}>
                Agree2Met is designed to support legal enforceability under applicable Simple Electronic Signature (SES) frameworks by capturing clear electronic consent, counterparty identity metadata, IP addresses, and tamper-evident audit logs.
              </p>
              <p className={styles.securityText}>
                Agree2Met provides Simple Electronic Signatures (SES) and does not provide Qualified Electronic Signatures (QES) or hardware certificate-based digital signatures. Enforceability depends upon your jurisdiction, the nature of the agreement, and process adherence. Always consult qualified legal counsel for cross-border or statutory requirements.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className={styles.faqSection}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionHeading}>Frequently Asked Questions</h2>
            <p className={styles.sectionSubheading}>
              Clear answers to technical and legal compliance questions.
            </p>
          </div>

          <div className={styles.faqList}>
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div key={index} className={styles.faqItem}>
                  <button
                    type="button"
                    className={styles.faqQuestion}
                    onClick={() => toggleFaq(index)}
                    aria-expanded={isOpen}
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      size={18}
                      className={`${styles.faqChevron} ${isOpen ? styles.rotated : ''}`}
                    />
                  </button>
                  {isOpen && <div className={styles.faqAnswer}><p>{faq.a}</p></div>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContainer}>
          <div className={styles.footerBrand}>
            <Logo size="md" />
            <p className={styles.footerTagline}>
              Digital agreement lifecycle management with cryptographic proof.
            </p>
          </div>

          <div className={styles.footerLinksGrid}>
            <div className={styles.footerCol}>
              <span className={styles.colHeader}>Product</span>
              <Link to="/app/dashboard">Live Demo</Link>
              <Link to="/app/agreements">Agreements Hub</Link>
              <Link to="/app/templates">Templates</Link>
              <Link to="/dev/components">UI Component Library</Link>
            </div>

            <div className={styles.footerCol}>
              <span className={styles.colHeader}>Legal</span>
              <Link to="/legal/terms">Terms of Service</Link>
              <Link to="/legal/privacy">Privacy Policy</Link>
              <Link to="/status">Infrastructure Status</Link>
            </div>

            <div className={styles.footerCol}>
              <span className={styles.colHeader}>Account</span>
              <Link to="/login">Sign In</Link>
              <Link to="/register">Create Account</Link>
              <Link to="/forgot-password">Reset Password</Link>
            </div>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <p>© 2026 Agree2Met Inc. All rights reserved. Designed to support commercial enforceability.</p>
        </div>
      </footer>
    </div>
  );
}
