import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Sparkles,
  AlertTriangle,
  Send,
  Copy,
  Check,
  ShieldAlert,
  FileSignature,
  MessageSquare,
  RefreshCw,
} from 'lucide-react';
import { Button } from '../../components/ui/Button/Button';
import { Input } from '../../components/ui/Input/Input';
import { Select } from '../../components/ui/Form/Select';
import { Textarea } from '../../components/ui/Input/Textarea';
import { Badge } from '../../components/ui/DataDisplay/Badge';
import { Skeleton } from '../../components/ui/Feedback/Skeleton';
import { useToast } from '../../context/ToastContext';
import { useOrganization } from '../../context/OrganizationContext';
import { useAuth } from '../../context/AuthContext';
import { aiService, agreementsService } from '../../services';
import styles from './AIAssistantPage.module.css';

const SUGGESTED_PROMPTS = [
  'Explain indemnification obligations in plain English',
  'Draft a mutual confidentiality and non-solicitation clause',
  'What is the standard SLA uptime penalty in cloud SaaS agreements?',
  'What key clauses are required in an independent contractor agreement?',
];

export function AIAssistantPage() {
  const { currentOrg } = useOrganization();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'drafter' | 'analyzer'

  // Chat tab state
  const [messages, setMessages] = useState([
    {
      id: 'm1',
      sender: 'assistant',
      text: 'Hello! I am your Agree2Met AI assistant. I can help analyze legal risks, draft customized clauses, clarify contractual terms, and summarize agreement obligations. How can I assist you today?',
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isChatThinking, setIsChatThinking] = useState(false);
  const messagesEndRef = useRef(null);

  // Drafter tab state
  const [clauseType, setClauseType] = useState('Confidentiality');
  const [businessObjective, setBusinessObjective] = useState('');
  const [riskStance, setRiskStance] = useState('balanced');
  const [draftedClause, setDraftedClause] = useState(null);
  const [isDrafting, setIsDrafting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Analyzer tab state
  const [agreements, setAgreements] = useState([]);
  const [selectedAgrId, setSelectedAgrId] = useState('');
  const [riskAnalysis, setRiskAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingAgreements, setLoadingAgreements] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (activeTab === 'chat') {
      scrollToBottom();
    }
  }, [messages, activeTab]);

  // Load agreements for analyzer
  const loadAgreements = useCallback(async () => {
    try {
      setLoadingAgreements(true);
      const res = await agreementsService.list({ orgId: currentOrg?.id });
      const items = res.items || [];
      setAgreements(items);
      if (items.length > 0 && !selectedAgrId) {
        setSelectedAgrId(items[0].id);
      }
    } catch {
      showToast({ title: 'Failed to load agreements', variant: 'danger' });
    } finally {
      setLoadingAgreements(false);
    }
  }, [currentOrg?.id, selectedAgrId, showToast]);

  useEffect(() => {
    loadAgreements();
  }, [loadAgreements]);

  // Handle Send Chat
  const handleSendChat = async (promptToSend) => {
    const query = (promptToSend || inputPrompt).trim();
    if (!query) return;

    const userMsg = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: query,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setIsChatThinking(true);

    try {
      const res = await aiService.chat(query);
      const assistantMsg = {
        id: `a-${Date.now()}`,
        sender: 'assistant',
        text: res.reply,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      showToast({ title: 'Could not reach AI copilot', variant: 'danger' });
    } finally {
      setIsChatThinking(false);
    }
  };

  // Handle Generate Clause
  const handleGenerateClause = async (e) => {
    e.preventDefault();
    try {
      setIsDrafting(true);
      const fullPrompt = `${businessObjective || 'Standard mutual commercial transaction'}. Stance: ${riskStance}`;
      const res = await aiService.draftClause(fullPrompt, clauseType);
      setDraftedClause(res);
      setIsCopied(false);
      showToast({ title: 'Clause drafted successfully', variant: 'success' });
    } catch {
      showToast({ title: 'Drafting failed', variant: 'danger' });
    } finally {
      setIsDrafting(false);
    }
  };

  const handleCopyClause = () => {
    if (!draftedClause) return;
    const textToCopy = `${draftedClause.title}\n\n${draftedClause.content}`;
    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
    showToast({ title: 'Clause copied to clipboard', variant: 'success' });
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Handle Risk Analysis
  const handleRunRiskAnalysis = async () => {
    if (!selectedAgrId) {
      showToast({ title: 'Please select an agreement', variant: 'warning' });
      return;
    }
    try {
      setIsAnalyzing(true);
      const res = await aiService.analyzeRisks(selectedAgrId);
      setRiskAnalysis(res);
      showToast({ title: 'Risk assessment complete', variant: 'success' });
    } catch {
      showToast({ title: 'Analysis failed', variant: 'danger' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h1>
            <Sparkles size={24} className={styles.sparkleIcon} />
            Agree2Met Legal AI Hub
          </h1>
          <p className={styles.subtitle}>
            Intelligent clause generation, automated contract risk assessment, and legal assistance for {currentOrg?.name}.
          </p>
        </div>
      </div>

      {/* Persistent Legal Disclaimer Banner */}
      <div className={styles.disclaimerBanner}>
        <AlertTriangle size={18} className={styles.disclaimerIcon} />
        <div className={styles.disclaimerText}>
          <strong>Mandatory Notice:</strong> Agree2Met AI provides informational assistance only and does not constitute legal advice. Consult a qualified legal professional.
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabNav}>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'chat' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          <MessageSquare size={16} />
          Interactive Assistant
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'drafter' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('drafter')}
        >
          <FileSignature size={16} />
          Clause Drafter
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'analyzer' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('analyzer')}
        >
          <ShieldAlert size={16} />
          Risk & Obligation Analyzer
        </button>
      </div>

      {/* Tab 1: Interactive Assistant Chat */}
      {activeTab === 'chat' && (
        <div className={styles.chatContainer}>
          {/* Suggested Prompts */}
          <div className={styles.promptPillsArea}>
            <span className={styles.pillsLabel}>Suggested:</span>
            {SUGGESTED_PROMPTS.map((p) => (
              <button
                key={p}
                type="button"
                className={styles.promptPill}
                onClick={() => handleSendChat(p)}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div className={styles.messagesList}>
            {messages.map((m) => (
              <div
                key={m.id}
                className={`${styles.messageRow} ${
                  m.sender === 'user' ? styles.userRow : styles.botRow
                }`}
              >
                <div
                  className={`${styles.avatarBox} ${
                    m.sender === 'assistant' ? styles.botAvatar : ''
                  }`}
                >
                  {m.sender === 'user' ? (user?.name?.[0] || 'U') : <Sparkles size={16} />}
                </div>
                <div
                  className={`${styles.bubble} ${
                    m.sender === 'user' ? styles.userBubble : styles.botBubble
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {isChatThinking && (
              <div className={`${styles.messageRow} ${styles.botRow}`}>
                <div className={`${styles.avatarBox} ${styles.botAvatar}`}>
                  <Sparkles size={16} />
                </div>
                <div className={`${styles.bubble} ${styles.botBubble}`}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <RefreshCw size={14} className="spin" />
                    <span>Analyzing legal context and generating response...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <form
            className={styles.chatInputArea}
            onSubmit={(e) => {
              e.preventDefault();
              handleSendChat();
            }}
          >
            <div style={{ flex: 1 }}>
              <Input
                placeholder="Ask Agree2Met AI a contract question or request a clause..."
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                disabled={isChatThinking}
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              icon={<Send size={16} />}
              loading={isChatThinking}
              disabled={!inputPrompt.trim()}
            >
              Send
            </Button>
          </form>
        </div>
      )}

      {/* Tab 2: Clause Drafter */}
      {activeTab === 'drafter' && (
        <div className={styles.panelCard}>
          <div>
            <h3 style={{ margin: '0 0 6px', fontSize: 'var(--text-lg)', fontWeight: 600 }}>
              AI Clause Drafter
            </h3>
            <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
              Generate tailored contract clauses aligned with your jurisdiction and commercial stance.
            </p>
          </div>

          <form onSubmit={handleGenerateClause} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className={styles.formGrid}>
              <div>
                <label
                  htmlFor="clause-type-select"
                  style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: '6px' }}
                >
                  Clause Type *
                </label>
                <Select
                  id="clause-type-select"
                  value={clauseType}
                  onChange={(e) => setClauseType(e.target.value)}
                  options={[
                    { value: 'Confidentiality', label: 'Confidentiality & Non-Disclosure' },
                    { value: 'Limitation of Liability', label: 'Limitation of Liability & Indemnification' },
                    { value: 'Termination for Cause', label: 'Termination for Cause & Default' },
                    { value: 'Intellectual Property Assignment', label: 'Intellectual Property Assignment' },
                    { value: 'Force Majeure', label: 'Force Majeure & Unforeseen Events' },
                    { value: 'Non-Solicitation', label: 'Non-Solicitation of Personnel' },
                    { value: 'Governing Law', label: 'Governing Law & Dispute Resolution' },
                  ]}
                />
              </div>

              <div>
                <label
                  htmlFor="risk-stance-select"
                  style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: '6px' }}
                >
                  Commercial Stance / Bias
                </label>
                <Select
                  id="risk-stance-select"
                  value={riskStance}
                  onChange={(e) => setRiskStance(e.target.value)}
                  options={[
                    { value: 'conservative', label: 'Conservative (Client/Buyer Friendly)' },
                    { value: 'balanced', label: 'Balanced (Mutual Protection)' },
                    { value: 'aggressive', label: 'Vendor-Favorable (Provider Friendly)' },
                  ]}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="biz-objective-input"
                style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: '6px' }}
              >
                Specific Business Intent & Context
              </label>
              <Textarea
                id="biz-objective-input"
                rows={3}
                placeholder="e.g. Cap damages at total fees paid in previous 12 months; carve out gross negligence and data breach."
                value={businessObjective}
                onChange={(e) => setBusinessObjective(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="submit"
                variant="primary"
                icon={<Sparkles size={16} />}
                loading={isDrafting}
              >
                Draft Clause
              </Button>
            </div>
          </form>

          {/* Drafted Clause Output */}
          {draftedClause && (
            <div className={styles.outputCard}>
              <div className={styles.outputHeader}>
                <h4 className={styles.outputTitle}>{draftedClause.title}</h4>
                <Button
                  size="sm"
                  variant="outline"
                  icon={isCopied ? <Check size={14} /> : <Copy size={14} />}
                  onClick={handleCopyClause}
                >
                  {isCopied ? 'Copied' : 'Copy Clause'}
                </Button>
              </div>
              <div className={styles.outputBody}>{draftedClause.content}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                {draftedClause.disclaimer}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Risk & Obligation Analyzer */}
      {activeTab === 'analyzer' && (
        <div className={styles.panelCard}>
          <div>
            <h3 style={{ margin: '0 0 6px', fontSize: 'var(--text-lg)', fontWeight: 600 }}>
              Automated Risk & Obligation Assessment
            </h3>
            <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
              Scan an agreement for uncapped liabilities, missing boilerplate, ambiguous deadlines, and compliance gaps.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '240px' }}>
              <label
                htmlFor="risk-target-agr"
                style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: '6px' }}
              >
                Select Target Agreement
              </label>
              <Select
                id="risk-target-agr"
                value={selectedAgrId}
                onChange={(e) => setSelectedAgrId(e.target.value)}
                options={(agreements || []).map((a) => ({
                  value: a.id,
                  label: `${a.title} (${a.status.replace('_', ' ')})`,
                }))}
                disabled={loadingAgreements}
              />
            </div>
            <Button
              variant="primary"
              icon={<ShieldAlert size={16} />}
              loading={isAnalyzing}
              onClick={handleRunRiskAnalysis}
            >
              Analyze Risks
            </Button>
          </div>

          {isAnalyzing && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Skeleton height="70px" />
              <Skeleton height="70px" />
            </div>
          )}

          {riskAnalysis && !isAnalyzing && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <Badge variant={riskAnalysis.issuesFound > 0 ? 'warning' : 'success'}>
                  Overall Risk: {riskAnalysis.overallRiskScore}
                </Badge>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                  {riskAnalysis.issuesFound} potential items flagged for legal review
                </span>
              </div>

              <div className={styles.riskFindingsList}>
                {(riskAnalysis.findings || []).map((finding) => (
                  <div key={finding.title} className={styles.findingItem}>
                    <div className={styles.findingHeader}>
                      <span className={styles.findingTitle}>{finding.title}</span>
                      <Badge
                        variant={
                          finding.level === 'high'
                            ? 'danger'
                            : finding.level === 'moderate'
                            ? 'warning'
                            : 'neutral'
                        }
                      >
                        {finding.level.toUpperCase()}
                      </Badge>
                    </div>
                    <p className={styles.findingDesc}>{finding.description}</p>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                {riskAnalysis.disclaimer}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
