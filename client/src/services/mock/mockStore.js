import {
  CURRENT_USER,
  ORGANIZATIONS,
  CATEGORIES,
  TEMPLATES,
  INITIAL_AGREEMENTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_REMINDERS,
} from './seedData';
import {
  computeAuditEventHash,
  verifyAuditChain as verifyCryptoAuditChain,
} from './cryptoChain';
import { isValidTransition } from '../../domain/agreementLifecycle';

const STORAGE_KEY = 'agree2met_mock_db_v2';

export const simulateLatency = (min = 200, max = 500) => {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, ms));
};

class MockStore {
  constructor() {
    this.state = this.loadState();
  }

  loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Could not load mock store from localStorage, using seed data:', e);
    }
    return this.getInitialState();
  }

  getInitialState() {
    return {
      user: { ...CURRENT_USER },
      organizations: JSON.parse(JSON.stringify(ORGANIZATIONS)),
      currentOrgId: 'org-acme',
      categories: [...CATEGORIES],
      templates: JSON.parse(JSON.stringify(TEMPLATES)),
      agreements: JSON.parse(JSON.stringify(INITIAL_AGREEMENTS)),
      archivedAgreements: [],
      notifications: JSON.parse(JSON.stringify(INITIAL_NOTIFICATIONS)),
      reminders: JSON.parse(JSON.stringify(INITIAL_REMINDERS)),
    };
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error('Failed to save mock state to localStorage:', e);
    }
  }

  reset() {
    this.state = this.getInitialState();
    this.save();
    return this.state;
  }

  // --- Auth & User ---
  async getCurrentUser() {
    await simulateLatency();
    return { ...this.state.user };
  }

  async updateProfile(updates) {
    await simulateLatency();
    this.state.user = { ...this.state.user, ...updates };
    this.save();
    return { ...this.state.user };
  }

  async login(email, password) {
    await simulateLatency(300, 600);
    if (!email || !password) throw new Error('Email and password required');
    this.state.user.email = email;
    this.save();
    return { user: { ...this.state.user } };
  }

  async register({ name, email, password }) {
    await simulateLatency(400, 700);
    if (!email || !password) throw new Error('Email and password required');
    this.state.user.name = name;
    this.state.user.email = email;
    this.save();
    return { user: { ...this.state.user } };
  }

  // --- Organizations ---
  async getOrganizations() {
    await simulateLatency();
    return [...this.state.organizations];
  }

  async getCurrentOrganization() {
    await simulateLatency();
    const org = this.state.organizations.find((o) => o.id === this.state.currentOrgId);
    return org || this.state.organizations[0];
  }

  async switchOrganization(orgId) {
    await simulateLatency(150, 300);
    const org = this.state.organizations.find((o) => o.id === orgId);
    if (!org) throw new Error(`Organization ${orgId} not found`);
    this.state.currentOrgId = orgId;
    this.save();
    return { ...org };
  }

  async getOrgMembers(orgId = this.state.currentOrgId) {
    await simulateLatency();
    const org = this.state.organizations.find((o) => o.id === orgId);
    return org ? [...org.members] : [];
  }

  async inviteOrgMember({ email, role, title }) {
    await simulateLatency(300, 500);
    const org = this.state.organizations.find((o) => o.id === this.state.currentOrgId);
    if (!org) throw new Error('Active organization not found');

    const newMember = {
      id: `usr-${Date.now().toString(36)}`,
      name: email.split('@')[0],
      email,
      role: role || 'MEMBER',
      title: title || 'Team Member',
    };
    org.members.push(newMember);
    org.membersCount = org.members.length;
    this.save();
    return newMember;
  }

  async updateOrgMemberRole(memberId, role) {
    await simulateLatency();
    const org = this.state.organizations.find((o) => o.id === this.state.currentOrgId);
    if (!org) throw new Error('Active organization not found');
    const member = org.members.find((m) => m.id === memberId);
    if (!member) throw new Error('Member not found');
    member.role = role;
    this.save();
    return member;
  }

  async removeOrgMember(memberId) {
    await simulateLatency();
    const org = this.state.organizations.find((o) => o.id === this.state.currentOrgId);
    if (!org) throw new Error('Active organization not found');
    org.members = org.members.filter((m) => m.id !== memberId);
    org.membersCount = org.members.length;
    this.save();
    return { success: true };
  }

  // --- Agreements ---
  async listAgreements({
    orgId = this.state.currentOrgId,
    status,
    categoryId,
    search,
    page = 1,
    pageSize = 10,
    sortBy = 'updatedAt',
    sortDir = 'desc',
  } = {}) {
    await simulateLatency();
    let list = this.state.agreements.filter((a) => a.orgId === orgId);

    if (status && status !== 'all') {
      const statuses = Array.isArray(status) ? status : [status];
      list = list.filter((a) => statuses.includes(a.status));
    }

    if (categoryId && categoryId !== 'all') {
      list = list.filter((a) => a.categoryId === categoryId);
    }

    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.number.toLowerCase().includes(q) ||
          a.summary?.toLowerCase().includes(q) ||
          a.parties.some((p) => p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q))
      );
    }

    list.sort((a, b) => {
      const valA = a[sortBy];
      const valB = b[sortBy];
      if (valA === undefined || valB === undefined) return 0;
      if (typeof valA === 'string') {
        return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortDir === 'asc' ? valA - valB : valB - valA;
    });

    const total = list.length;
    const startIndex = (page - 1) * pageSize;
    const items = list.slice(startIndex, startIndex + pageSize);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    };
  }

  async getAgreementById(id) {
    await simulateLatency();
    const agr = this.state.agreements.find((a) => a.id === id);
    if (!agr) throw new Error(`Agreement ${id} not found`);
    return JSON.parse(JSON.stringify(agr));
  }

  async createAgreement(data) {
    await simulateLatency(300, 600);
    const id = `agr-${Date.now().toString(36)}`;
    const orgId = data.orgId || this.state.currentOrgId;
    const number = `AGR-${new Date().getFullYear()}-${String(this.state.agreements.length + 1).padStart(3, '0')}`;

    const newAgreement = {
      id,
      orgId,
      number,
      title: data.title || 'Untitled Agreement',
      categoryId: data.categoryId || 'cat-vendor',
      status: 'draft',
      value: data.value ? Number(data.value) : null,
      currency: data.currency || 'USD',
      effectiveDate: data.effectiveDate || new Date().toISOString().slice(0, 10),
      expirationDate: data.expirationDate || null,
      summary: data.summary || '',
      parties: data.parties || [
        {
          id: 'p1',
          name: this.state.user.name,
          email: this.state.user.email,
          role: 'Signer',
          signingOrder: 1,
          status: 'pending',
          token: `tok_${Math.random().toString(36).substring(2, 12)}`,
        },
      ],
      clauses: data.clauses || [
        { id: 'c1', title: '1. Engagement and Scope', content: data.summary || 'Standard terms as agreed.', order: 0 },
        { id: 'c2', title: '2. Payment Terms', content: 'Payment in net 30 days upon receipt of invoice.', order: 1 },
      ],
      paymentMilestones: data.paymentMilestones || [],
      versions: [
        {
          version: 'v1.0',
          createdAt: new Date().toISOString(),
          author: this.state.user.name,
          summary: 'Initial draft created.',
        },
      ],
      documents: [],
      auditTrail: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Initialize audit trail genesis record
    const genesisRecord = {
      id: `aud-${id}-1`,
      agreementId: id,
      timestamp: new Date().toISOString(),
      actor: `${this.state.user.name} (${this.state.user.title || 'Author'})`,
      action: 'AGREEMENT_CREATED',
      details: `Initialized agreement ${number}: "${newAgreement.title}"`,
      previousHash: 'GENESIS_0000000000000000000000000000000000000000000000000000000000000000',
    };
    genesisRecord.hash = computeAuditEventHash(genesisRecord, genesisRecord.previousHash);
    newAgreement.auditTrail = [genesisRecord];

    this.state.agreements.unshift(newAgreement);
    this.save();
    return newAgreement;
  }

  async updateAgreement(id, updates) {
    await simulateLatency(250, 450);
    const index = this.state.agreements.findIndex((a) => a.id === id);
    if (index === -1) throw new Error(`Agreement ${id} not found`);

    const current = this.state.agreements[index];
    const updated = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Log update audit event
    const lastRecord = updated.auditTrail[updated.auditTrail.length - 1];
    const prevHash = lastRecord ? lastRecord.hash : 'GENESIS_0000000000000000000000000000000000000000000000000000000000000000';
    const newRecord = {
      id: `aud-${id}-${updated.auditTrail.length + 1}`,
      agreementId: id,
      timestamp: new Date().toISOString(),
      actor: `${this.state.user.name} (${this.state.user.title || 'User'})`,
      action: 'CONTENT_UPDATED',
      details: updates.title ? `Updated title or clauses for ${updated.number}` : 'Agreement content updated',
      previousHash: prevHash,
    };
    newRecord.hash = computeAuditEventHash(newRecord, prevHash);
    updated.auditTrail.push(newRecord);

    this.state.agreements[index] = updated;
    this.save();
    return updated;
  }

  async transitionAgreement(id, targetStatus, actorName = this.state.user.name, details) {
    await simulateLatency(300, 500);
    const agr = this.state.agreements.find((a) => a.id === id);
    if (!agr) throw new Error(`Agreement ${id} not found`);

    if (!isValidTransition(agr.status, targetStatus)) {
      throw new Error(`Invalid transition from ${agr.status} to ${targetStatus}`);
    }

    const previousStatus = agr.status;
    agr.status = targetStatus;
    agr.updatedAt = new Date().toISOString();

    // Append cryptographic audit record
    const lastRecord = agr.auditTrail[agr.auditTrail.length - 1];
    const prevHash = lastRecord ? lastRecord.hash : 'GENESIS_0000000000000000000000000000000000000000000000000000000000000000';
    const auditRecord = {
      id: `aud-${id}-${agr.auditTrail.length + 1}`,
      agreementId: id,
      timestamp: new Date().toISOString(),
      actor: actorName,
      action: `STATUS_CHANGED_${targetStatus.toUpperCase()}`,
      details: details || `Status changed from ${previousStatus} to ${targetStatus}`,
      previousHash: prevHash,
    };
    auditRecord.hash = computeAuditEventHash(auditRecord, prevHash);
    agr.auditTrail.push(auditRecord);

    // If fully signed or active, mark all parties as signed
    if (['signed', 'active'].includes(targetStatus)) {
      agr.parties = agr.parties.map((p) => ({
        ...p,
        status: 'signed',
        signedAt: p.signedAt || new Date().toISOString(),
      }));
    }

    this.save();
    return agr;
  }

  async verifyAuditChain(id) {
    await simulateLatency(150, 300);
    const agr = this.state.agreements.find((a) => a.id === id);
    if (!agr) throw new Error(`Agreement ${id} not found`);
    return verifyCryptoAuditChain(agr.auditTrail);
  }

  // Intentionally tamper with an audit record to test verification engine UI
  async tamperAuditRecord(agreementId, recordIndex = 0) {
    const agr = this.state.agreements.find((a) => a.id === agreementId);
    if (!agr || !agr.auditTrail[recordIndex]) return false;
    agr.auditTrail[recordIndex].details += ' [TAMPERED_INSPECTION_TEST]';
    this.save();
    return true;
  }

  async archiveAgreement(id) {
    await simulateLatency();
    const index = this.state.agreements.findIndex((a) => a.id === id);
    if (index === -1) throw new Error('Agreement not found');
    const [archived] = this.state.agreements.splice(index, 1);
    archived.archivedAt = new Date().toISOString();
    this.state.archivedAgreements.unshift(archived);
    this.save();
    return { success: true };
  }

  async unarchiveAgreement(id) {
    await simulateLatency();
    const index = this.state.archivedAgreements.findIndex((a) => a.id === id);
    if (index === -1) throw new Error('Archived agreement not found');
    const [unarchived] = this.state.archivedAgreements.splice(index, 1);
    delete unarchived.archivedAt;
    this.state.agreements.unshift(unarchived);
    this.save();
    return unarchived;
  }

  async listArchivedAgreements() {
    await simulateLatency();
    return [...this.state.archivedAgreements];
  }

  async hardDeleteAgreement(id) {
    await simulateLatency();
    this.state.archivedAgreements = this.state.archivedAgreements.filter((a) => a.id !== id);
    this.state.agreements = this.state.agreements.filter((a) => a.id !== id);
    this.save();
    return { success: true };
  }

  // --- Public Guest Signing Portal ---
  async getAgreementBySigningToken(token) {
    await simulateLatency(300, 500);
    for (const agr of this.state.agreements) {
      const party = agr.parties.find((p) => p.token === token);
      if (party) {
        return {
          agreement: { ...agr },
          party: { ...party },
        };
      }
    }
    // Check fallback demo tokens
    if (token.startsWith('tok_') && this.state.agreements.length > 0) {
      const sample = this.state.agreements[12] || this.state.agreements[0];
      return {
        agreement: { ...sample },
        party: sample.parties[1] || sample.parties[0],
      };
    }
    throw new Error('Signing token is invalid, expired, or has already been used.');
  }

  async submitSignature(token, { signerName, signatureData, ipAddress = '198.51.100.88' }) {
    await simulateLatency(400, 700);
    for (const agr of this.state.agreements) {
      const partyIndex = agr.parties.findIndex((p) => p.token === token);
      if (partyIndex !== -1) {
        agr.parties[partyIndex].status = 'signed';
        agr.parties[partyIndex].signedAt = new Date().toISOString();
        agr.parties[partyIndex].signatureUrl = signatureData;
        agr.parties[partyIndex].ipAddress = ipAddress;

        // Add audit trail event
        const lastRecord = agr.auditTrail[agr.auditTrail.length - 1];
        const prevHash = lastRecord ? lastRecord.hash : 'GENESIS_0000000000000000000000000000000000000000000000000000000000000000';
        const newRecord = {
          id: `aud-${agr.id}-${agr.auditTrail.length + 1}`,
          agreementId: agr.id,
          timestamp: new Date().toISOString(),
          actor: `${signerName} (${agr.parties[partyIndex].role})`,
          action: 'PARTY_SIGNED',
          details: `Electronic signature captured and verified. IP: ${ipAddress}. Consent recorded.`,
          previousHash: prevHash,
        };
        newRecord.hash = computeAuditEventHash(newRecord, prevHash);
        agr.auditTrail.push(newRecord);

        // Check if all parties are signed
        const allSigned = agr.parties.every((p) => p.status === 'signed');
        if (allSigned) {
          agr.status = 'signed';
        } else {
          agr.status = 'partially_signed';
        }
        agr.updatedAt = new Date().toISOString();

        this.save();
        return { success: true, agreement: agr };
      }
    }
    return { success: true };
  }

  async declineSigning(token, reason) {
    await simulateLatency(300, 500);
    for (const agr of this.state.agreements) {
      const party = agr.parties.find((p) => p.token === token);
      if (party) {
        party.status = 'declined';
        agr.status = 'cancelled';
        agr.updatedAt = new Date().toISOString();

        const lastRecord = agr.auditTrail[agr.auditTrail.length - 1];
        const prevHash = lastRecord ? lastRecord.hash : 'GENESIS_0000000000000000000000000000000000000000000000000000000000000000';
        const newRecord = {
          id: `aud-${agr.id}-${agr.auditTrail.length + 1}`,
          agreementId: agr.id,
          timestamp: new Date().toISOString(),
          actor: party.name,
          action: 'SIGNING_DECLINED',
          details: `Signer declined to execute agreement. Reason: ${reason || 'Not specified'}`,
          previousHash: prevHash,
        };
        newRecord.hash = computeAuditEventHash(newRecord, prevHash);
        agr.auditTrail.push(newRecord);

        this.save();
        return { success: true };
      }
    }
    return { success: true };
  }

  // --- Templates & Categories ---
  async listTemplates() {
    await simulateLatency();
    return [...this.state.templates];
  }

  async getTemplateById(id) {
    await simulateLatency();
    const tmpl = this.state.templates.find((t) => t.id === id);
    if (!tmpl) throw new Error('Template not found');
    return { ...tmpl };
  }

  async listCategories() {
    await simulateLatency();
    return [...this.state.categories];
  }

  // --- Notifications & Reminders ---
  async listNotifications() {
    await simulateLatency();
    return [...this.state.notifications];
  }

  async markNotificationRead(id) {
    const notif = this.state.notifications.find((n) => n.id === id);
    if (notif) notif.read = true;
    this.save();
    return notif;
  }

  async markAllNotificationsRead() {
    this.state.notifications.forEach((n) => (n.read = true));
    this.save();
    return true;
  }

  async listReminders() {
    await simulateLatency();
    return [...this.state.reminders];
  }

  async createReminder(data) {
    await simulateLatency();
    const newRem = {
      id: `rem-${Date.now().toString(36)}`,
      ...data,
    };
    this.state.reminders.push(newRem);
    this.save();
    return newRem;
  }

  async deleteReminder(id) {
    await simulateLatency();
    this.state.reminders = this.state.reminders.filter((r) => r.id !== id);
    this.save();
    return { success: true };
  }

  // --- Dashboard Aggregations ---
  async getDashboardStats(orgId = this.state.currentOrgId) {
    await simulateLatency(200, 400);
    const orgAgreements = this.state.agreements.filter((a) => a.orgId === orgId);

    const counts = {
      total: orgAgreements.length,
      draft: orgAgreements.filter((a) => a.status === 'draft').length,
      in_review: orgAgreements.filter((a) => a.status === 'in_review').length,
      approved: orgAgreements.filter((a) => a.status === 'approved').length,
      awaiting_signatures: orgAgreements.filter((a) => a.status === 'awaiting_signatures').length,
      partially_signed: orgAgreements.filter((a) => a.status === 'partially_signed').length,
      signed: orgAgreements.filter((a) => a.status === 'signed').length,
      active: orgAgreements.filter((a) => a.status === 'active').length,
      completed: orgAgreements.filter((a) => a.status === 'completed').length,
      expired: orgAgreements.filter((a) => a.status === 'expired').length,
      terminated: orgAgreements.filter((a) => a.status === 'terminated').length,
      disputed: orgAgreements.filter((a) => a.status === 'disputed').length,
      cancelled: orgAgreements.filter((a) => a.status === 'cancelled').length,
    };

    const activeTotalValue = orgAgreements
      .filter((a) => ['signed', 'active'].includes(a.status) && a.value)
      .reduce((sum, a) => sum + a.value, 0);

    const upcomingDeadlines = orgAgreements
      .filter((a) => a.expirationDate && new Date(a.expirationDate) >= new Date())
      .sort((a, b) => new Date(a.expirationDate) - new Date(b.expirationDate))
      .slice(0, 5);

    const recentAgreements = [...orgAgreements]
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 6);

    return {
      counts,
      activeTotalValue,
      upcomingDeadlines,
      recentAgreements,
    };
  }

  // --- AI Assistant Mock Service ---
  async draftClauseWithAI(prompt, clauseType) {
    await simulateLatency(600, 1200);
    return {
      title: `${clauseType || 'Custom'} Clause (AI-Generated)`,
      content: `The parties acknowledge that for the purposes of ${prompt || 'the transaction'}, each party shall exercise commercially reasonable best efforts to adhere to industry best practices, complying with relevant standards and applicable federal and state data regulations.`,
      disclaimer: 'Agree2Met AI provides informational assistance only and does not constitute legal advice. Consult a qualified legal professional.',
    };
  }

  async analyzeRisksWithAI(agreementId) {
    await simulateLatency(800, 1400);
    return {
      agreementId,
      overallRiskScore: 'Low-Medium',
      issuesFound: 2,
      findings: [
        {
          level: 'moderate',
          title: 'Uncapped Consequential Damages',
          description: 'Clause 4 lacks an explicit aggregate liability cap. Consider specifying 12-month fees paid limit.',
        },
        {
          level: 'low',
          title: '30-Day Auto-Renewal Window',
          description: 'Standard enterprise agreements often require 60 days advance notice of non-renewal.',
        },
      ],
      disclaimer: 'Agree2Met AI provides informational assistance only and does not constitute legal advice. Consult a qualified legal professional.',
    };
  }
}

export const mockStore = new MockStore();
