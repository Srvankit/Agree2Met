import { useState } from 'react';
import {
  Sparkles,
  Send,
  Copy,
  Check,
  ShieldAlert,
  FileCheck,
  RefreshCw,
} from 'lucide-react';
import { Drawer } from '../ui/Overlay/Drawer';
import { Button } from '../ui/Button/Button';
import { useAIAssistant } from '../../context/AIAssistantContext';
import { useToast } from '../../context/ToastContext';
import { aiService } from '../../services';
import styles from './AIDrawer.module.css';

export function AIDrawer() {
  const { isOpen, close, contextData } = useAIAssistant();
  const { addToast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const quickPrompts = [
    { label: 'Draft Confidentiality Clause', prompt: 'Draft a bilateral confidentiality clause protecting technical source code and proprietary trade secrets.' },
    { label: 'Draft Limitation of Liability', prompt: 'Draft a standard mutual limitation of liability clause capped at 12 months fees paid.' },
    { label: 'Analyze Agreement Risks', prompt: 'Analyze potential risks in standard vendor MSA terms including IP indemnification.' },
    { label: 'Draft Termination for Cause', prompt: 'Draft a termination for cause clause with 30-day cure period for material breach.' },
  ];

  const handleGenerate = async (customPrompt) => {
    const textToRun = customPrompt || prompt;
    if (!textToRun.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      if (textToRun.toLowerCase().includes('risk') || textToRun.toLowerCase().includes('analyze')) {
        const data = await aiService.analyzeRisks(contextData?.agreementId || 'agr-01');
        setResult({ type: 'risk', data });
      } else {
        const data = await aiService.draftClause(textToRun, 'Commercial');
        setResult({ type: 'clause', data });
      }
    } catch (err) {
      console.error('AI generation error:', err);
      addToast({ title: 'AI Assistant Error', message: 'Failed to process AI request.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    const text = result.type === 'clause' ? result.data.content : JSON.stringify(result.data.findings, null, 2);
    navigator.clipboard.writeText(text);
    setCopied(true);
    addToast({ title: 'Copied to Clipboard', type: 'info' });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={close}
      title="Agree2Met AI Copilot"
      description="Legal document drafting and risk analysis assistant"
      size="lg"
      footer={
        <div className={styles.drawerFooter}>
          <p className={styles.legalNotice}>
            <strong>Notice:</strong> Agree2Met AI provides informational assistance only and does not constitute legal advice. Consult a qualified legal professional.
          </p>
        </div>
      }
    >
      <div className={styles.drawerBody}>
        {/* Quick Prompts */}
        <div className={styles.section}>
          <span className={styles.sectionTitle}>Quick Assistant Actions</span>
          <div className={styles.promptsGrid}>
            {quickPrompts.map((item, idx) => (
              <button
                key={idx}
                type="button"
                className={styles.promptBtn}
                onClick={() => {
                  setPrompt(item.prompt);
                  handleGenerate(item.prompt);
                }}
              >
                <Sparkles size={14} className={styles.sparkleIcon} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Input box */}
        <div className={styles.inputSection}>
          <textarea
            className={styles.textarea}
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the contract clause, terms, or risk question you need assistance with..."
          />
          <div className={styles.submitRow}>
            <Button
              variant="primary"
              size="sm"
              leftIcon={loading ? RefreshCw : Send}
              isLoading={loading}
              onClick={() => handleGenerate()}
              disabled={!prompt.trim()}
            >
              Generate with AI
            </Button>
          </div>
        </div>

        {/* Output Area */}
        {result && (
          <div className={styles.resultCard}>
            <div className={styles.resultHeader}>
              <div className={styles.resultTitle}>
                {result.type === 'clause' ? (
                  <>
                    <FileCheck size={16} className={styles.successIcon} />
                    <span>{result.data.title}</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert size={16} className={styles.warningIcon} />
                    <span>Risk Analysis (Score: {result.data.overallRiskScore})</span>
                  </>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                leftIcon={copied ? Check : Copy}
                onClick={handleCopy}
              >
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>

            <div className={styles.resultContent}>
              {result.type === 'clause' ? (
                <p className="document-body">{result.data.content}</p>
              ) : (
                <div className={styles.risksList}>
                  {result.data.findings.map((f, i) => (
                    <div key={i} className={styles.riskItem}>
                      <div className={styles.riskItemHeader}>
                        <span className={`${styles.riskBadge} ${styles[f.level]}`}>
                          {f.level.toUpperCase()}
                        </span>
                        <strong className={styles.riskTitle}>{f.title}</strong>
                      </div>
                      <p className={styles.riskDesc}>{f.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
}
