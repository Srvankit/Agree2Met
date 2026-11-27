import {describe,it,expect} from 'vitest';
import {statuses,transition,validActions,canEdit,canDelete,consentText,canManage,canWrite} from './lifecycle';
import {seed,stats,changeStatus,appendAudit,verifyAudit} from '../services/mock';
describe('Agreement lifecycle',()=>{
 it('covers all nine requested statuses',()=>expect(statuses).toHaveLength(9));
 it('permits draft to sent and blocks completed to sent',()=>{expect(transition('Draft','Sent')).toBe('Sent');expect(()=>transition('Completed','Sent')).toThrow();});
 it('restricts editing to drafts and pending review',()=>{expect(canEdit('Draft')).toBe(true);expect(canEdit('Pending Review')).toBe(true);expect(canEdit('Sent')).toBe(false);expect(canEdit('Completed')).toBe(false);});
 it('only allows deletion in non-active states',()=>{expect(canDelete('Cancelled')).toBe(true);expect(canDelete('Awaiting Signatures')).toBe(false);expect(canDelete('Completed')).toBe(false);});
 it('restricts demo management to Owner and Admin',()=>{expect(canManage('Owner')).toBe(true);expect(canManage('Admin')).toBe(true);expect(canManage('Member')).toBe(false);expect(canManage('Viewer')).toBe(false);});
 it('blocks demo writing as Viewer',()=>{expect(canWrite('Viewer')).toBe(false);expect(canWrite('Member')).toBe(true);});
 it('seeds 30 agreements in two organizations with nine categories',()=>{const data=seed();expect(data.agreements).toHaveLength(30);expect(new Set(data.agreements.map(a=>a.org)).size).toBe(2);expect(data.categories).toHaveLength(9);expect(new Set(data.agreements.map(a=>a.status)).size).toBe(9);});
 it('computes statistics from actual rows',()=>{const data=seed();const first=data.agreements[0];if(!first)throw new Error('Missing seed');expect(stats([first]).total).toBe(1);expect(stats([first]).pending).toBe(1);expect(stats([]).rate).toBe(0);expect(stats(data.agreements).completed).toBe(14);});
 it('checks transitions in the service helper',()=>{const data=seed();const first=data.agreements[0];if(!first)throw new Error('Missing seed');expect(changeStatus(first,'Completed').status).toBe('Completed');expect(()=>changeStatus(first,'Draft')).toThrow();});
});
