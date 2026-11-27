import { Link } from '@tanstack/react-router';
import {
  FileText,
  ShieldCheck,
  Sparkles,
  Users,
  ArrowRight,
  PenLine,
  Activity,
} from 'lucide-react';
import { Button } from '../components/demo/ui';
import { Logo } from '../components/demo/Shell';
import { ActivityChart, StatusDonut } from '../components/demo/Charts';
import { useWorkspace } from '../context/Workspace';
import { aiDisclaimer } from '../domain/lifecycle';
import s from './pages.module.css';

export function Landing() {
  const { data, user } = useWorkspace();
  const safeAgreements = Array.isArray(data?.agreements) ? data.agreements : [];

  return (
    <main className={s.landing}>
      <nav className={s.landingNav}>
        <Link to="/" className={s.authLogo}>
          <Logo />
          Agree2Met
        </Link>
        <div className={s.flex}>
          <Link to="/terms">Terms</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/status">System Status</Link>
          <Link to={user ? '/account' : '/auth'} className={s.textLink}>
            {user ? 'My account' : 'Sign in'}
          </Link>
          <Link to="/" className={s.textLink}>
            Explore demo <ArrowRight size={14} />
          </Link>
        </div>
      </nav>

      <section className={s.landingHero}>
        <div className={s.eyebrow}>A better way to agree</div>
        <h1>Agree2Met</h1>
        <p>From the first draft to the final signature. A clear, considered home for all your agreements.</p>
        <div className={s.flex} style={{ justifyContent: 'center' }}>
          <Link to="/register">
            <Button variant="primary" icon={ArrowRight}>
              Create your account
            </Button>
          </Link>
          <Link to="/">
            <Button>Explore the workspace</Button>
          </Link>
        </div>
      </section>

      <div className={s.chartGrid}>
        <section className={s.panel}>
          <div className={s.panelHead}>
            <h2>Your agreements, in perspective</h2>
          </div>
          <div className={s.panelBody}>
            <ActivityChart rows={safeAgreements} />
          </div>
        </section>
        <section className={s.panel}>
          <div className={s.panelHead}>
            <h2>A little less chasing. A lot more clarity.</h2>
          </div>
          <StatusDonut rows={safeAgreements} />
        </section>
      </div>

      <section className={s.landingSection}>
        <h2>Room for every detail.</h2>
        <div className={s.landingFeatures}>
          {[
            [FileText, 'Thoughtful drafting', 'Build agreements with reusable clauses, clear payment milestones, and a live document preview.'],
            [Users, 'Everyone on the same page', 'Bring your parties together and keep track of each signature.'],
            [Activity, 'A clear view of progress', 'Track deadlines, agreement statuses, and your workspace’s activity.'],
          ].map(([Icon, title, text]) => (
            <div key={title}>
              <Icon size={26} />
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={s.landingSection}>
        <h2>From intention to agreement.</h2>
        <div className={s.landingFeatures}>
          {['Create', 'Invite', 'Sign', 'Track'].map((step, i) => (
            <div key={step}>
              <div className={s.eyebrow}>0{i + 1}</div>
              <h3>{step}</h3>
              <p>
                {[
                  'Bring together the terms that matter.',
                  'Add the people involved.',
                  'Review and apply an electronic signature.',
                  'Follow every agreement to completion.',
                ][i]}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className={s.landingSection}>
        <h2>A considered approach to security.</h2>
        <div className={s.landingFeatures}>
          <div>
            <ShieldCheck size={26} />
            <h3>Your profile, private.</h3>
            <p>Real accounts use secure authentication. Private profile access is restricted to the profile’s owner.</p>
          </div>
          <div>
            <PenLine size={26} />
            <h3>Consent comes first.</h3>
            <p>Signers explicitly consent before applying a signature. Agreement changes have a verifiable SHA-256 audit chain.</p>
          </div>
          <div>
            <Sparkles size={26} />
            <h3>A fresh perspective.</h3>
            <p>Draft, explain, summarize and review clauses with our simulated agreement assistant.</p>
          </div>
        </div>
        <p className={s.notice} style={{ marginTop: 30 }}>
          Legal validity depends on jurisdiction. Consult a qualified legal professional. Demo agreements and signatures are browser-local simulations and are not a production signing service.
        </p>
        <p className={s.muted} style={{ marginTop: 20 }}>
          {aiDisclaimer}
        </p>
      </section>

      <section className={s.landingSection}>
        <h2>A few things worth knowing.</h2>
        {[
          ['Is this a live signing service?', 'This is a frontend demo. Agreements, signatures, invitations and AI responses are simulated and stored in your browser. Secure login and private profiles are managed by Agree2Met services.'],
          ['Can I download my agreements?', 'Yes. Download text documents, export CSV reports, or print an agreement to save it as a PDF.'],
          ['Is AI assistance legal advice?', aiDisclaimer],
          ['Are electronic signatures valid everywhere?', 'Legal validity depends on jurisdiction, the type of document and applicable requirements. Consult counsel before using electronic signatures for real agreements.'],
        ].map(([question, answer]) => (
          <details className={s.faq} key={question}>
            <summary>{question}</summary>
            <p>{answer}</p>
          </details>
        ))}
      </section>

      <footer className={s.between}>
        <b>Agree2Met © 2026</b>
        <div className={s.flex}>
          <Link to="/terms">Terms</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/status">System Status</Link>
          <Link to="/auth">Sign in</Link>
        </div>
      </footer>
    </main>
  );
}

export function Legal({ kind }) {
  return (
    <main className={s.landing}>
      <Link to="/" className={s.textLink}>
        ← Agree2Met
      </Link>
      <section className={s.landingSection}>
        <h1>{kind === 'terms' ? 'Terms of use' : 'Privacy policy'}</h1>
        <p className={s.notice} style={{ margin: '24px 0' }}>
          Draft placeholder — not a final legal policy. Review with qualified counsel before public use.
        </p>
        <p>
          {kind === 'terms'
            ? 'Agree2Met currently provides a demonstration workspace. Its documents, invitations, signatures, and AI output are illustrative. Legal validity depends on jurisdiction. Consult counsel before relying on an agreement.'
            : 'Account credentials and private profiles are handled securely. Demo agreements, signatures, files, preferences and conversations are stored locally in your browser. Resetting browser data removes those demo records. A complete privacy policy should be prepared before production use.'}
        </p>
      </section>
    </main>
  );
}
