'use client';

import { useState, useEffect, useRef } from 'react';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  pending: { label: 'Pending', dot: '#f59e0b', bg: '#fffbeb', text: '#92400e' },
  approved: { label: 'Approved', dot: '#12895E', bg: '#f0fdf6', text: '#065f46' },
  notified: { label: 'Invited', dot: '#685EFC', bg: '#f5f3ff', text: '#4338ca' },
  rejected: { label: 'Rejected', dot: '#ef4444', bg: '#fef2f2', text: '#991b1b' },
};

function StatusBadge({ status }: { status: keyof typeof STATUS_CONFIG }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
      style={{ backgroundColor: cfg.bg, color: cfg.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

function Field({ label, value, mono }: { label: string; value?: string | number; mono?: boolean }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-[10px] font-semibold tracking-widest uppercase text-[#A49595] mb-1">
        {label}
      </p>
      <p className={`text-sm text-[#16252D] leading-snug ${mono ? 'font-mono text-xs' : ''}`}>
        {value}
      </p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-bold tracking-widest uppercase text-[#A49595] mb-3 pb-2 border-b border-[#f0ece8]">
        {title}
      </p>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}

function ActionButton({ onClick, disabled, loading, variant, children }: { onClick: () => void; disabled?: boolean; loading?: boolean; variant: 'primary' | 'success' | 'danger' | 'ghost'; children: React.ReactNode }) {
  const base = 'flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-[#685EFC] text-white hover:bg-[#5a51e0]',
    success: 'bg-[#12895E] text-white hover:bg-[#0f7250]',
    danger: 'bg-white text-red-600 border border-red-200 hover:bg-red-50',
    ghost: 'bg-white text-[#16252D] border border-[#ede9e5] hover:bg-[#faf9f7]',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${variants[variant] || variants.ghost}`}
    >
      {loading && (
        <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
          <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      )}
      {children}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function EntryDrawer({ entry, onClose, onUpdated }: { entry: any; onClose: () => void; onUpdated: (data: any) => void }) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState('');
  const [showInviteInput, setShowInviteInput] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: string } | null>(null);
  const overlayRef = useRef(null);

  // Close on overlay click
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) onClose();
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e: { key: string; }) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const showToast = (message: string, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const updateStatus = async (status: string, extra = {}) => {
    setActionLoading(status);
    try {
      const res = await fetch(`/api/admin/waitlist/${entry._id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, ...extra })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Status updated to "${status}"`);
        onUpdated(data.data);
      } else {
        showToast(data.message || 'Update failed', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const sendInvite = async () => {
    if (!inviteUrl.trim()) {
      showToast('Please enter an invite URL', 'error');
      return;
    }
    setActionLoading('invite');
    try {
      const res = await fetch(`/api/admin/waitlist/${entry._id}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteUrl: inviteUrl.trim() })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Invitation email sent!');
        setShowInviteInput(false);
        setInviteUrl('');
        onUpdated(data.data);
      } else {
        showToast(data.message || 'Failed to send invite', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const deleteEntry = async () => {
    if (!window.confirm(`Remove ${entry.companyName} from the waitlist? This cannot be undone.`)) return;
    setActionLoading('delete');
    try {
      const res = await fetch(`/api/admin/waitlist/${entry._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('Entry deleted');
        setTimeout(() => { onClose(); onUpdated(null); }, 800);
      } else {
        showToast(data.message || 'Delete failed', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  if (!entry) return null;

  return (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        onClick={handleOverlayClick}
        className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40 transition-opacity"
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-105 bg-white shadow-2xl z-50 flex flex-col">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-[#f0ece8]">
          <div>
            <h2 className="text-base font-bold text-[#16252D] tracking-tight leading-tight">
              {entry.companyName}
            </h2>
            <div className="flex items-center gap-2 mt-1.5">
              <StatusBadge status={entry.status} />
              <span className="text-[11px] text-[#A49595]">#{entry.position}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#A49595] hover:text-[#16252D] hover:bg-[#f5f2f0] rounded-lg transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-7">

          {/* Contact */}
          <Section title="Contact">
            <Field label="Name" value={`${entry.contactName} · ${entry.contactRole}`} />
            <Field label="Email" value={entry.email} mono />
          </Section>

          {/* Company */}
          <Section title="Company">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Size" value={`${entry.companySize} people`} />
              <Field label="Industry" value={entry.industry} />
            </div>
            <Field label="Website" value={entry.website} />
          </Section>

          {/* Hiring Intent */}
          {(entry.hiringRoles?.length > 0 || entry.techStacks?.length > 0 || entry.hiringTimeline) && (
            <Section title="Hiring Intent">
              {entry.hiringRoles?.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold tracking-widest uppercase text-[#A49595] mb-2">Roles</p>
                  <div className="flex flex-wrap gap-1.5">
                    {entry.hiringRoles.map((r: string, idx: number) => (
                      <span key={idx} className="px-2.5 py-1 bg-[#f5f3ff] text-[#685EFC] text-xs font-medium rounded-md">
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {entry.techStacks?.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold tracking-widest uppercase text-[#A49595] mb-2">Tech Stack</p>
                  <div className="flex flex-wrap gap-1.5">
                    {entry.techStacks.map((t: string, idx: number) => (
                      <span key={idx} className="px-2.5 py-1 bg-[#f0f4f4] text-[#16252D] text-xs font-medium rounded-md">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <Field label="Timeline" value={entry.hiringTimeline} />
            </Section>
          )}

          {/* Meta */}
          <Section title="Meta">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Signed Up" value={new Date(entry.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} />
              <Field label="Heard via" value={entry.hearAboutUs} />
            </div>
            {entry.adminNote && (
              <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2.5">
                <p className="text-[10px] font-semibold tracking-widest uppercase text-amber-600 mb-1">Admin Note</p>
                <p className="text-xs text-amber-800 leading-relaxed">{entry.adminNote}</p>
              </div>
            )}
          </Section>
        </div>

        {/* Actions footer */}
        <div className="shrink-0 px-6 pb-6 pt-4 border-t border-[#f0ece8] space-y-2.5">

          {/* Invite flow */}
          {['pending', 'approved'].includes(entry.status) && (
            showInviteInput ? (
              <div className="space-y-2">
                <input
                  type="url"
                  value={inviteUrl}
                  onChange={e => setInviteUrl(e.target.value)}
                  placeholder="https://app.juniorforge.io/register?ref=..."
                  className="w-full px-3 py-2.5 text-xs text-[#16252D] border border-[#ede9e5] rounded-lg outline-none focus:border-[#685EFC] focus:ring-2 focus:ring-[#685EFC]/10 placeholder:text-[#c4bcb8]"
                  onKeyDown={e => e.key === 'Enter' && sendInvite()}
                />
                <div className="grid grid-cols-2 gap-2">
                  <ActionButton
                    onClick={() => setShowInviteInput(false)}
                    variant="ghost"
                  >
                    Cancel
                  </ActionButton>
                  <ActionButton
                    onClick={sendInvite}
                    loading={actionLoading === 'invite'}
                    variant="primary"
                  >
                    Send Invite
                  </ActionButton>
                </div>
              </div>
            ) : (
              <ActionButton
                onClick={() => setShowInviteInput(true)}
                variant="primary"
              >
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M1 6.5h11M7 1.5l5 5-5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Send Invitation
              </ActionButton>
            )
          )}

          {/* Status transitions */}
          <div className="grid grid-cols-2 gap-2">
            {entry.status !== 'approved' && entry.status !== 'notified' && (
              <ActionButton
                onClick={() => updateStatus('approved')}
                loading={actionLoading === 'approved'}
                variant="success"
              >
                Approve
              </ActionButton>
            )}
            {entry.status !== 'rejected' && entry.status !== 'notified' && (
              <ActionButton
                onClick={() => updateStatus('rejected')}
                loading={actionLoading === 'rejected'}
                variant="danger"
              >
                Reject
              </ActionButton>
            )}
            {entry.status === 'notified' && (
              <ActionButton
                onClick={() => updateStatus('approved')}
                loading={actionLoading === 'approved'}
                variant="ghost"
              >
                Move to Approved
              </ActionButton>
            )}
          </div>

          {/* Delete */}
          <button
            onClick={deleteEntry}
            disabled={actionLoading === 'delete'}
            className="w-full text-center text-[11px] text-[#A49595] hover:text-red-500 transition-colors py-1"
          >
            {actionLoading === 'delete' ? 'Deleting…' : 'Remove from waitlist'}
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`
          fixed bottom-6 right-6 z-60 flex items-center gap-2.5 px-4 py-3
          rounded-xl shadow-lg text-sm font-medium
          ${toast.type === 'error'
            ? 'bg-red-600 text-white'
            : 'bg-[#16252D] text-white'
          }
        `}>
          {toast.type === 'error' ? (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="6" stroke="white" strokeWidth="1.3" />
              <path d="M7 4v3M7 9.5v.5" stroke="white" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 7l3.5 3.5L12 3" stroke="#37ffb7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          {toast.message}
        </div>
      )}
    </>
  );
}