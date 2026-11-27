export const statuses = ['Draft', 'Pending Review', 'Sent', 'Awaiting Signatures', 'Partially Signed', 'Completed', 'Rejected', 'Cancelled', 'Expired'];
const transitions = {
  Draft: ['Pending Review', 'Sent', 'Cancelled'],
  'Pending Review': ['Draft', 'Sent', 'Rejected', 'Cancelled'],
  Sent: ['Awaiting Signatures', 'Rejected', 'Cancelled', 'Expired'],
  'Awaiting Signatures': ['Partially Signed', 'Completed', 'Rejected', 'Cancelled', 'Expired'],
  'Partially Signed': ['Completed', 'Rejected', 'Cancelled', 'Expired'],
  Completed: [], Rejected: ['Draft'], Cancelled: ['Draft'], Expired: ['Draft'],
};
export const validActions = status => transitions[status] ?? [];
export function transition(current, next) { if (!validActions(current).includes(next)) throw new Error(`Cannot change ${current} to ${next}`); return next; }
export const canEdit = status => ['Draft', 'Pending Review'].includes(status);
export const canDelete = status => ['Draft', 'Cancelled', 'Rejected', 'Expired'].includes(status);
export const consentText = 'I consent to transact electronically and to apply my electronic signature to this document.';
export const aiDisclaimer = 'Agree2Met AI provides informational assistance only and does not constitute legal advice. Consult a qualified legal professional.';
export const canManage = role => ['Owner', 'Admin'].includes(role);
export const canWrite = role => role !== 'Viewer';
