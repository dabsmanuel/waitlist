'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import EntryDrawer from './EntryDrawer';
import BulkInviteModal from './BulkInviteModal';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  pending:  { label: 'Pending',  dot: '#f59e0b', bg: '#fffbeb', text: '#92400e' },
  approved: { label: 'Approved', dot: '#12895E', bg: '#f0fdf6', text: '#065f46' },
  notified: { label: 'Invited',  dot: '#685EFC', bg: '#f5f3ff', text: '#4338ca' },
  rejected: { label: 'Rejected', dot: '#ef4444', bg: '#fef2f2', text: '#991b1b' },
};

const SIZE_LABELS = ['1-10', '11-50', '51-200', '201-500', '500+'];

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusDot({ status }: { status: keyof typeof STATUS_CONFIG }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap"
      style={{ backgroundColor: cfg.bg, color: cfg.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

function EmptyState({ hasFilters, onClear }: { hasFilters: boolean; onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-12 h-12 rounded-full bg-[#f5f2f0] flex items-center justify-center mb-4">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="9" cy="9" r="7" stroke="#A49595" strokeWidth="1.5"/>
          <path d="M14 14l4 4" stroke="#A49595" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
      <p className="text-sm font-semibold text-[#16252D] mb-1">
        {hasFilters ? 'No results found' : 'No entries yet'}
      </p>
      <p className="text-xs text-[#A49595] max-w-xs leading-relaxed">
        {hasFilters ? 'Try adjusting your filters or search term.' : 'Waitlist entries will appear here once startups sign up.'}
      </p>
      {hasFilters && (
        <button
          onClick={onClear}
          className="mt-4 text-xs font-semibold text-[#685EFC] hover:underline"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-[#f5f2f0] animate-pulse">
      <td className="px-4 py-4"><div className="w-4 h-4 bg-[#f0ece8] rounded" /></td>
      <td className="px-4 py-4">
        <div className="h-3.5 w-32 bg-[#f0ece8] rounded mb-1.5" />
        <div className="h-2.5 w-24 bg-[#f5f2f0] rounded" />
      </td>
      <td className="px-4 py-4 hidden md:table-cell"><div className="h-3 w-20 bg-[#f5f2f0] rounded" /></td>
      <td className="px-4 py-4 hidden lg:table-cell"><div className="h-6 w-16 bg-[#f5f2f0] rounded-lg" /></td>
      <td className="px-4 py-4 hidden lg:table-cell"><div className="h-3 w-14 bg-[#f5f2f0] rounded" /></td>
      <td className="px-4 py-4"><div className="h-6 w-20 bg-[#f5f2f0] rounded-lg" /></td>
      <td className="px-4 py-4"><div className="h-3 w-16 bg-[#f5f2f0] rounded" /></td>
    </tr>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface WaitlistEntry {
  _id: string;
  companyName: string;
  contactName: string;
  contactRole: string;
  email: string;
  companySize: string;
  hiringTimeline?: string;
  status: keyof typeof STATUS_CONFIG;
  createdAt: string;
}

export default function EntriesTable({ compact = false, defaultLimit, onNeedRefresh }: { compact?: boolean; defaultLimit?: number; onNeedRefresh?: () => void }) {
  const [entries, setEntries]           = useState<WaitlistEntry[]>([]);
  const [loading, setLoading]           = useState(true);
  const [pagination, setPagination]     = useState({ total: 0, pages: 1, page: 1, limit: defaultLimit || 20 });
  const [selectedEntry, setSelectedEntry] = useState<WaitlistEntry | null>(null);
  const [selectedIds, setSelectedIds]   = useState<string[]>([]);
  const [showBulkModal, setShowBulkModal] = useState(false);

  // Filters
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sizeFilter, setSizeFilter]     = useState('');
  const [sortBy, setSortBy]             = useState('-createdAt');

  const searchTimer = useRef<NodeJS.Timeout | null>(null);
  const hasFilters = !!(search || statusFilter || sizeFilter);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchEntries = useCallback(async (params: { page?: number; limit?: number; sortBy?: string; search?: string; status?: string; size?: string } = {}): Promise<void> => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        page:    String(params.page    || pagination.page),
        limit:   String(params.limit   || pagination.limit),
        sortBy:  params.sortBy  || sortBy,
        ...(params.search  !== undefined ? { search:  params.search  } : search  ? { search  } : {}),
        ...(params.status  !== undefined ? { status:  params.status  } : statusFilter ? { status: statusFilter } : {}),
        ...(params.size    !== undefined ? { companySize: params.size } : sizeFilter   ? { companySize: sizeFilter } : {}),
      });
      const res = await fetch(`/api/admin/waitlist?${qs}`);
      const data = await res.json();
      if (data.success) {
        setEntries(data.data);
        setPagination(data.pagination);
        setSelectedIds([]); // clear selection on re-fetch
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [pagination.page, pagination.limit, sortBy, search, statusFilter, sizeFilter]);

  useEffect(() => { fetchEntries({ page: 1 }); }, []);

  // Debounced search
  const handleSearch = (val: string) => {
    setSearch(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchEntries({ search: val, page: 1 }), 350);
  };

  const applyFilter = (field: string, val: string) => {
    if (field === 'status') { setStatusFilter(val); fetchEntries({ status: val, page: 1 }); }
    if (field === 'size')   { setSizeFilter(val);   fetchEntries({ size: val,   page: 1 }); }
  };

  const clearFilters = () => {
    setSearch(''); setStatusFilter(''); setSizeFilter('');
    fetchEntries({ search: '', status: '', size: '', page: 1 });
  };

  const goToPage = (p: number) => fetchEntries({ page: p });

  // ── Selection ──────────────────────────────────────────────────────────────

  const toggleSelect = (id: any) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    setSelectedIds(prev =>
      prev.length === entries.length ? [] : entries.map(e => e._id)
    );
  };

  const allSelected = entries.length > 0 && selectedIds.length === entries.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < entries.length;

  // ── Drawer callbacks ───────────────────────────────────────────────────────

  const handleEntryUpdated = (updated: WaitlistEntry | null) => {
    if (!updated) {
      // deleted
      setSelectedEntry(null);
      fetchEntries();
      onNeedRefresh?.();
      return;
    }
    setEntries(prev => prev.map(e => e._id === updated._id ? updated : e));
    setSelectedEntry(updated);
    onNeedRefresh?.();
  };

  // ── Sort ───────────────────────────────────────────────────────────────────

  const handleSort = (field: string) => {
    const next = sortBy === field ? `-${field}` : field;
    setSortBy(next);
    fetchEntries({ sortBy: next, page: 1 });
  };

  const SortIcon = ({ field }: { field: string }) => {
    const active = sortBy === field || sortBy === `-${field}`;
    const desc   = sortBy === `-${field}`;
    return (
      <svg width="10" height="12" viewBox="0 0 10 12" fill="none" className={`ml-1 inline ${active ? 'opacity-100' : 'opacity-25'}`}>
        <path d={desc ? "M5 2L2 6h6L5 2Z" : "M5 10L8 6H2l3 4Z"} fill={active ? '#685EFC' : 'currentColor'}/>
      </svg>
    );
  };

  const selectedEntries = entries.filter(e => selectedIds.includes(e._id));
  const eligibleForInvite = selectedEntries.filter(e => ['pending', 'approved'].includes(e.status));

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="bg-white rounded-xl border border-[#ede9e5] overflow-hidden">

        {/* ── Toolbar ──────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 border-b border-[#f0ece8]">

          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                 className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A49595]">
              <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M10 10l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Search company, email…"
              className="w-full pl-9 pr-4 py-2 text-xs text-[#16252D] border border-[#e8e4e0] rounded-lg outline-none focus:border-[#685EFC] focus:ring-2 focus:ring-[#685EFC]/10 placeholder:text-[#c4bcb8] transition-all"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={e => applyFilter('status', e.target.value)}
              className={`px-3 py-2 text-xs rounded-lg border outline-none transition-all
                ${statusFilter ? 'border-[#685EFC] text-[#685EFC] bg-[#f5f3ff]' : 'border-[#e8e4e0] text-[#888080] bg-white'}
                focus:border-[#685EFC]`}
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="notified">Invited</option>
              <option value="rejected">Rejected</option>
            </select>

            {/* Size filter */}
            <select
              value={sizeFilter}
              onChange={e => applyFilter('size', e.target.value)}
              className={`px-3 py-2 text-xs rounded-lg border outline-none transition-all
                ${sizeFilter ? 'border-[#685EFC] text-[#685EFC] bg-[#f5f3ff]' : 'border-[#e8e4e0] text-[#888080] bg-white'}
                focus:border-[#685EFC]`}
            >
              <option value="">All sizes</option>
              {SIZE_LABELS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            {hasFilters && (
              <button
                onClick={clearFilters}
                className="px-3 py-2 text-xs text-[#A49595] hover:text-[#16252D] border border-[#e8e4e0] rounded-lg transition-colors"
              >
                Clear
              </button>
            )}

            {/* Bulk actions */}
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2 ml-2 pl-2 border-l border-[#e8e4e0]">
                <span className="text-xs font-semibold text-[#685EFC]">
                  {selectedIds.length} selected
                </span>
                {eligibleForInvite.length > 0 && (
                  <button
                    onClick={() => setShowBulkModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#685EFC] text-white text-xs font-semibold rounded-lg hover:bg-[#5a51e0] transition-colors"
                  >
                    Invite {eligibleForInvite.length}
                  </button>
                )}
              </div>
            )}

            {/* Export */}
            <a
              href="/api/admin/waitlist/export"
              className="flex items-center gap-1.5 px-3 py-2 text-xs text-[#16252D] border border-[#e8e4e0] rounded-lg hover:bg-[#faf9f7] transition-colors ml-auto"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 1v7M3 5l3 3 3-3M1 10h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Export CSV
            </a>
          </div>
        </div>

        {/* ── Table ────────────────────────────────────────────── */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#f0ece8]">
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={el => { if (el) el.indeterminate = someSelected; }}
                    onChange={toggleSelectAll}
                    className="w-3.5 h-3.5 accent-[#685EFC] cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('companyName')}
                    className="text-[10px] font-bold tracking-widest uppercase text-[#A49595] hover:text-[#16252D] transition-colors"
                  >
                    Company <SortIcon field="companyName" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left hidden md:table-cell">
                  <span className="text-[10px] font-bold tracking-widest uppercase text-[#A49595]">Contact</span>
                </th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">
                  <span className="text-[10px] font-bold tracking-widest uppercase text-[#A49595]">Size</span>
                </th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">
                  <span className="text-[10px] font-bold tracking-widest uppercase text-[#A49595]">Timeline</span>
                </th>
                <th className="px-4 py-3 text-left">
                  <span className="text-[10px] font-bold tracking-widest uppercase text-[#A49595]">Status</span>
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('createdAt')}
                    className="text-[10px] font-bold tracking-widest uppercase text-[#A49595] hover:text-[#16252D] transition-colors"
                  >
                    Joined <SortIcon field="createdAt" />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: compact ? 5 : 8 }).map((_, i) => <SkeletonRow key={i} />)
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState hasFilters={hasFilters} onClear={clearFilters} />
                  </td>
                </tr>
              ) : (
                entries.map(entry => {
                  const isSelected = selectedIds.includes(entry._id);
                  return (
                    <tr
                      key={entry._id}
                      onClick={() => setSelectedEntry(entry)}
                      className={`
                        border-b border-[#f5f2f0] cursor-pointer transition-colors duration-100
                        ${isSelected ? 'bg-[#f5f3ff]' : 'hover:bg-[#faf9f7]'}
                      `}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-3.5 w-10" onClick={e => { e.stopPropagation(); toggleSelect(entry._id); }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(entry._id)}
                          className="w-3.5 h-3.5 accent-[#685EFC] cursor-pointer"
                        />
                      </td>

                      {/* Company */}
                      <td className="px-4 py-3.5">
                        <p className="text-sm font-semibold text-[#16252D] leading-tight">
                          {entry.companyName}
                        </p>
                        <p className="text-xs text-[#A49595] mt-0.5 md:hidden">
                          {entry.contactName}
                        </p>
                        <p className="text-xs text-[#A49595] mt-0.5 font-mono">
                          {entry.email}
                        </p>
                      </td>

                      {/* Contact */}
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <p className="text-xs font-medium text-[#16252D]">{entry.contactName}</p>
                        <p className="text-xs text-[#A49595]">{entry.contactRole}</p>
                      </td>

                      {/* Size */}
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        <span className="text-xs text-[#16252D]">{entry.companySize}</span>
                      </td>

                      {/* Timeline */}
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        <span className="text-xs text-[#A49595]">{entry.hiringTimeline || '—'}</span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <StatusDot status={entry.status} />
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3.5">
                        <span className="text-xs text-[#A49595] whitespace-nowrap">
                          {new Date(entry.createdAt).toLocaleDateString('en-GB', {
                            day: 'numeric', month: 'short'
                          })}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ───────────────────────────────────────── */}
        {!compact && pagination.pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-[#f0ece8]">
            <p className="text-xs text-[#A49595]">
              {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total.toLocaleString()}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => goToPage(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#e8e4e0] text-[#16252D] hover:bg-[#faf9f7] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M8 10L4 6.5 8 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                const page = pagination.pages <= 5
                  ? i + 1
                  : pagination.page <= 3
                    ? i + 1
                    : pagination.page >= pagination.pages - 2
                      ? pagination.pages - 4 + i
                      : pagination.page - 2 + i;
                return (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-all
                      ${pagination.page === page
                        ? 'bg-[#685EFC] text-white border border-[#685EFC]'
                        : 'border border-[#e8e4e0] text-[#16252D] hover:bg-[#faf9f7]'
                      }`}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                onClick={() => goToPage(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#e8e4e0] text-[#16252D] hover:bg-[#faf9f7] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M5 3l4 3.5L5 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Compact "view all" link */}
        {compact && pagination.total > (defaultLimit || 8) && (
          <div className="px-5 py-3 border-t border-[#f0ece8]">
            <p className="text-xs text-[#A49595]">
              Showing {Math.min(defaultLimit || 8, entries.length)} of {pagination.total.toLocaleString()} entries
            </p>
          </div>
        )}
      </div>

      {/* Drawer */}
      {selectedEntry && (
        <EntryDrawer
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
          onUpdated={handleEntryUpdated}
        />
      )}

      {/* Bulk invite modal */}
      {showBulkModal && (
        <BulkInviteModal
          selectedIds={eligibleForInvite.map(e => e._id)}
          selectedEntries={eligibleForInvite}
          onClose={() => setShowBulkModal(false)}
          onComplete={() => {
            setShowBulkModal(false);
            setSelectedIds([]);
            fetchEntries();
            onNeedRefresh?.();
          }}
        />
      )}
    </>
  );
}