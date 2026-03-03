'use client';

import { useState, useEffect, useRef } from 'react';

interface BulkInviteModalProps {
  selectedIds: string[];
  selectedEntries: Array<{ _id: string; companyName: string; contactName: string; email: string }>;
  onClose: () => void;
  onComplete: () => void;
}

export default function BulkInviteModal({ selectedIds, selectedEntries, onClose, onComplete }: BulkInviteModalProps) {
  const [baseUrl, setBaseUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message?: string; data?: { sent?: any[]; failed?: any[] } } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
    const handler = (e: { key: string; }) => { if (e.key === 'Escape' && !loading) onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [loading, onClose]);

  const handleSend = async () => {
    if (!baseUrl.trim()) {
      inputRef.current?.focus();
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/admin/waitlist/bulk-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: selectedIds,
          baseInviteUrl: baseUrl.trim()
        })
      });
      const data = await res.json();
      setResult(data);
      if (data.success) onComplete();
    } catch {
      setResult({ success: false, message: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/25 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-[#ede9e5] shadow-2xl w-full max-w-md">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-5 border-b border-[#f0ece8]">
          <div>
            <h2 className="text-sm font-bold text-[#16252D] tracking-tight">
              Bulk Invite
            </h2>
            <p className="text-xs text-[#A49595] mt-0.5">
              Sending to {selectedIds.length} startup{selectedIds.length !== 1 ? 's' : ''}
            </p>
          </div>
          {!loading && (
            <button
              onClick={onClose}
              className="p-1.5 text-[#A49595] hover:text-[#16252D] hover:bg-[#f5f2f0] rounded-lg transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>

        <div className="px-6 py-5 space-y-5">

          {/* Result state */}
          {result && (
            <div className={`rounded-xl px-4 py-3.5 ${result.success ? 'bg-[#f0fdf6] border border-[#c1eddd]' : 'bg-red-50 border border-red-100'}`}>
              {result.success ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <svg width="14" height="11" viewBox="0 0 14 11" fill="none">
                      <path d="M1 5.5L5 9.5L13 1" stroke="#12895E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="text-sm font-semibold text-[#065f46]">
                      {result.data?.sent?.length || 0} invitations sent
                    </span>
                  </div>
                  {(result.data?.failed?.length ?? 0) > 0 && (
                    <p className="text-xs text-amber-700 pl-5">
                      {result.data?.failed?.length ?? 0} failed — check logs
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-red-700">{result.message}</p>
              )}
            </div>
          )}

          {/* Companies list */}
          {!result && (
            <>
              <div>
                <p className="text-[10px] font-semibold tracking-widest uppercase text-[#A49595] mb-2.5">
                  Recipients
                </p>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {selectedEntries.map(e => (
                    <div key={e._id} className="flex items-center justify-between py-1.5 px-3 bg-[#faf9f7] rounded-lg">
                      <div>
                        <span className="text-xs font-semibold text-[#16252D]">{e.companyName}</span>
                        <span className="text-xs text-[#A49595] ml-2">{e.contactName}</span>
                      </div>
                      <span className="text-[10px] text-[#A49595]">{e.email}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold tracking-widest uppercase text-[#A49595] mb-2">
                  Base Invite URL <span className="text-[#685EFC]">*</span>
                </label>
                <input
                  ref={inputRef}
                  type="url"
                  value={baseUrl}
                  onChange={e => setBaseUrl(e.target.value)}
                  placeholder="https://app.juniorforge.io/register"
                  className="w-full px-3.5 py-3 text-sm text-[#16252D] border border-[#e8e4e0] rounded-lg outline-none focus:border-[#685EFC] focus:ring-2 focus:ring-[#685EFC]/10 placeholder:text-[#c4bcb8] transition-all"
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                />
                <p className="text-[11px] text-[#A49595] mt-1.5 leading-snug">
                  Each email will receive a unique link: <code className="text-[#685EFC]">?email=&ref=id</code> appended automatically.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex items-center gap-3">
          {result ? (
            <button
              onClick={onClose}
              className="flex-1 py-2.5 bg-[#16252D] text-white text-sm font-semibold rounded-xl hover:bg-[#1e3340] transition-colors"
            >
              Close
            </button>
          ) : (
            <>
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 py-2.5 bg-white text-[#16252D] text-sm font-semibold border border-[#ede9e5] rounded-xl hover:bg-[#faf9f7] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={loading || !baseUrl.trim()}
                className="flex-1 py-2.5 bg-[#685EFC] text-white text-sm font-semibold rounded-xl hover:bg-[#5a51e0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeOpacity="0.3"/>
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                    </svg>
                    Sending…
                  </>
                ) : `Send ${selectedIds.length} Invite${selectedIds.length !== 1 ? 's' : ''}`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}