import {describe,it,expect,vi} from 'vitest';
import {webcrypto} from 'node:crypto';
import {seed,appendAudit,verifyAudit} from './mock';
describe('SHA-256 audit chain',()=>{
 it('verifies a chain and detects a changed event',async()=>{vi.stubGlobal('crypto',webcrypto);const a=seed().agreements[0];if(!a)throw new Error('Missing seed');const first=await appendAudit(a,'Created');const second=await appendAudit({...a,audit:[first]},'Signed');expect(await verifyAudit([first,second])).toBe(true);expect(await verifyAudit([{...first,action:'Tampered'},second])).toBe(false);vi.unstubAllGlobals();});
});
