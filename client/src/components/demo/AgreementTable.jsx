import { useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { FileText, Copy, Archive, Download, Trash2, Eye, PenLine, X } from 'lucide-react';
import { Button, Badge, Menu, Avatar, EmptyState } from './ui';
import { AgreementLink } from './Shell';
import { useWorkspace } from '../../context/Workspace';
import { canEdit, canDelete, validActions, canWrite } from '../../domain/lifecycle';
import { download, documentText, money, dateLabel } from '../../services/mock';
import { isServiceReal } from '../../services/serviceMode';
import { agreementsService } from '../../services/agreementsService';
import s from '../../pages/pages.module.css';

export function AgreementActions({ agreement: a }) {
  const { update, editAgreement, data, toast } = useWorkspace();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isReal = isServiceReal('agreements') || isServiceReal('agreements-write');

  async function duplicate() {
    if (isReal) {
      try {
        const copy = await agreementsService.duplicateAgreement(a.id, data.org);
        await queryClient.invalidateQueries({ queryKey: ['agreements'] });
        await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        await queryClient.invalidateQueries({ queryKey: ['analytics'] });
        toast('Agreement duplicated');
        navigate({ to: '/app/agreements/$id', params: { id: copy.id } });
      } catch (err) {
        toast('Failed to duplicate agreement');
      }
      return;
    }

    const copy = {
      ...a,
      id: `AG-2026-${Date.now()}`,
      title: `${a.title} (copy)`,
      status: 'Draft',
      token: `demo-${Date.now()}`,
      audit: [],
      archived: false,
      parties: (a.parties || []).map((p) => ({ ...p, signed: false })),
    };
    update((d) => ({ ...d, agreements: [copy, ...d.agreements] }));
    toast('Agreement duplicated');
  }

  async function toggleArchive() {
    if (isReal) {
      try {
        await agreementsService.archiveAgreement(a.id, !a.archived, data.org);
        await queryClient.invalidateQueries({ queryKey: ['agreements'] });
        await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        toast(a.archived ? 'Agreement restored' : 'Agreement archived');
      } catch (err) {
        toast('Failed to update archive status');
      }
      return;
    }

    await editAgreement(
      a.id,
      { archived: !a.archived },
      a.archived ? 'Agreement restored' : 'Agreement archived'
    );
  }

  async function cancelAgreement() {
    if (isReal) {
      try {
        await agreementsService.changeStatus(a.id, 'CANCELLED', 'Agreement cancelled', data.org);
        await queryClient.invalidateQueries({ queryKey: ['agreements'] });
        await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        toast('Agreement cancelled');
      } catch (err) {
        toast(err.message || 'Failed to cancel agreement');
      }
      return;
    }

    await editAgreement(a.id, { status: 'Cancelled' }, 'Agreement cancelled');
  }

  async function deleteAgreement() {
    if (!confirm(`Delete “${a.title}”? This cannot be undone.`)) return;

    if (isReal) {
      try {
        await agreementsService.deleteAgreement(a.id, data.org);
        await queryClient.invalidateQueries({ queryKey: ['agreements'] });
        await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        toast('Agreement deleted');
      } catch (err) {
        toast(err.message || 'Failed to delete agreement');
      }
      return;
    }

    update((d) => ({ ...d, agreements: d.agreements.filter((x) => x.id !== a.id) }));
    toast('Agreement deleted');
  }

  const isEditable = canEdit(a.status);
  const isDeletable = canDelete(a.status);
  const canCancel =
    validActions(a.status).includes('Cancelled') ||
    validActions(a.status).includes('CANCELLED') ||
    ['Draft', 'DRAFT', 'Pending Review', 'PENDING_REVIEW'].includes(a.status);

  return (
    <Menu>
      <Button
        variant="ghost"
        icon={Eye}
        onClick={() => navigate({ to: '/app/agreements/$id', params: { id: a.id } })}
      >
        View agreement
      </Button>

      {canWrite(data.demoRole) && (
        <>
          {isEditable && (
            <Button
              variant="ghost"
              icon={PenLine}
              onClick={() => navigate({ to: '/app/new', search: { edit: a.id } })}
            >
              Edit agreement
            </Button>
          )}

          <Button variant="ghost" icon={Copy} onClick={duplicate}>
            Duplicate
          </Button>

          <Button variant="ghost" icon={Archive} onClick={toggleArchive}>
            {a.archived ? 'Restore' : 'Archive'}
          </Button>

          {canCancel && (
            <Button variant="ghost" icon={X} onClick={cancelAgreement}>
              Cancel agreement
            </Button>
          )}

          {isDeletable && (
            <Button variant="danger" icon={Trash2} onClick={deleteAgreement}>
              Delete
            </Button>
          )}
        </>
      )}

      <Button variant="ghost" icon={Download} onClick={() => download(`${a.id}.txt`, documentText(a))}>
        Download document
      </Button>
    </Menu>
  );
}

export function AgreementTable({
  rows,
  selectable = false,
  selected = [],
  onSelect = () => {},
  compact = false,
}) {
  if (!rows.length) return <EmptyState />;

  return (
    <div className={s.tableWrap}>
      <table className={s.table}>
        <thead>
          <tr>
            {selectable && (
              <th>
                <input
                  className={s.check}
                  type="checkbox"
                  aria-label="Select all agreements"
                  checked={rows.every((a) => selected.includes(a.id))}
                  onChange={(e) => onSelect(e.target.checked ? rows.map((a) => a.id) : [])}
                />
              </th>
            )}
            <th>Agreement name</th>
            {!compact && <th>Category</th>}
            <th>Status</th>
            <th>Parties</th>
            {!compact && <th>Value</th>}
            <th>{compact ? 'Last updated' : 'Deadline'}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((a) => (
            <tr key={a.id}>
              {selectable && (
                <td>
                  <input
                    className={s.check}
                    type="checkbox"
                    aria-label={`Select ${a.title}`}
                    checked={selected.includes(a.id)}
                    onChange={(e) =>
                      onSelect(
                        e.target.checked ? [...selected, a.id] : selected.filter((x) => x !== a.id)
                      )
                    }
                  />
                </td>
              )}
              <td>
                <AgreementLink id={a.id} className={s.tableTitle}>
                  <span className={s.fileIcon}>
                    <FileText />
                  </span>
                  <div>
                    <strong>{a.title}</strong>
                    <div className={s.reference}>{a.referenceNumber || a.id}</div>
                  </div>
                </AgreementLink>
              </td>
              {!compact && <td className={s.muted}>{a.category}</td>}
              <td>
                <Badge status={a.status} />
              </td>
              <td>
                <div className={s.flex}>
                  {(a.parties || []).slice(0, 2).map((p) => (
                    <Avatar key={p.email || p.name} name={p.name} />
                  ))}
                </div>
              </td>
              {!compact && <td>{money(a.value)}</td>}
              <td className={s.muted}>{dateLabel(compact ? a.created : a.deadline)}</td>
              <td>
                <AgreementActions agreement={a} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
