'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
// ─── Types ───────────────────────────────────────────────────────────────────

interface FormData {
  companyName: string;
  contactName: string;
  contactRole: string;
  email: string;
  companySize: string;
  industry: string;
  hiringRoles: string[];
  hiringTimeline: string;
  hearAboutUs: string;
}

interface SubmitState {
  status: 'idle' | 'loading' | 'success' | 'error' | 'duplicate';
  message: string;
  position?: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const ROLES = ['CEO', 'CTO', 'CPO', 'HR Manager', 'Engineering Manager', 'Founder', 'Recruiter', 'Other'];
const SIZES = ['1-10', '11-50', '51-200', '201-500', '500+'];
const TIMELINES = ['Immediately', 'Within 1 month', 'Within 3 months', 'Just exploring'];
const REFERRALS = ['Twitter / X', 'LinkedIn', 'Word of mouth', 'Google search', 'Newsletter', 'Other'];
const HIRING_ROLES = [
  'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
  'Mobile Developer', 'DevOps Engineer', 'Data Engineer',
  'QA Engineer', 'UI/UX Designer', 'Product Manager', 'Graphics Designer', 'Cybersecurity Specialist', 'AI/ML Engineer', 'Other'
];

const INITIAL_FORM: FormData = {
  companyName: '', contactName: '', contactRole: '',
  email: '', companySize: '', industry: '',
  hiringRoles: [], hiringTimeline: '', hearAboutUs: ''
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold tracking-widest uppercase text-[#3a3737] mb-2">
      {children}
      {required && <span className="text-[#685EFC] ml-0.5">*</span>}
    </label>
  );
}

function Input({
  type = 'text', name, value, onChange, placeholder, required
}: {
  type?: string; name: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string; required?: boolean;
}) {
  return (
    <input
      type={type} name={name} value={value}
      onChange={onChange} placeholder={placeholder} required={required}
      className="
        w-full px-4 py-3 text-sm text-[#16252D]
        bg-white border border-[#e8e4e0]
        rounded-lg outline-none
        placeholder:text-[#c4bcb8]
        focus:border-[#685EFC] focus:ring-2 focus:ring-[#685EFC]/10
        transition-all duration-150
      "
    />
  );
}

function Select({
  name, value, onChange, options, placeholder, required
}: {
  name: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: string[]; placeholder: string; required?: boolean;
}) {
  return (
    <select
      name={name} value={value} onChange={onChange} required={required}
      className={`
        w-full px-4 py-3 text-sm rounded-lg border border-[#e8e4e0]
        bg-white outline-none appearance-none
        focus:border-[#685EFC] focus:ring-2 focus:ring-[#685EFC]/10
        transition-all duration-150
        ${value ? 'text-[#16252D]' : 'text-[#c4bcb8]'}
      `}
    >
      <option value="" disabled hidden>{placeholder}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function Checkbox({
  label, checked, onChange
}: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button" onClick={onChange}
      className={`
        flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border text-sm
        transition-all duration-150 text-left
        ${checked
          ? 'border-[#685EFC] bg-[#685EFC]/6 text-[#16252D] font-medium'
          : 'border-[#e8e4e0] text-[#888080] hover:border-[#685EFC]/50 hover:text-[#16252D]'
        }
      `}
    >
      <span className={`
        w-4 h-4 shrink-0 rounded border flex items-center justify-center
        transition-all duration-150
        ${checked ? 'bg-[#685EFC] border-[#685EFC]' : 'border-[#d0c8c4]'}
      `}>
        {checked && (
          <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
            <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      {label}
    </button>
  );
}

// ─── Success Screen ───────────────────────────────────────────────────────────

function SuccessScreen({ position, email }: { position?: number; email: string }) {
  return (
    <div className="text-center py-8 px-4">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#c1eddd] mb-6">
        <svg width="22" height="17" viewBox="0 0 22 17" fill="none">
          <path d="M1 8.5L7.5 15L21 1" stroke="#12895E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {position && (
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#f5f0ff] rounded-full mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#685EFC]" />
          <span className="text-xs font-semibold text-[#685EFC] tracking-wide">
            #{position} on the waitlist
          </span>
        </div>
      )}

      <h2 className="text-2xl font-bold text-[#16252D] tracking-tight mb-3">
        You're in.
      </h2>
      <p className="text-[#6b6464] text-sm leading-relaxed max-w-xs mx-auto mb-2">
        We've reserved your spot and sent a confirmation to <strong className="text-[#16252D]">{email}</strong>.
      </p>
      <p className="text-[#A49595] text-xs leading-relaxed max-w-65 mx-auto">
        We'll reach out personally when access opens — no mass blast, just a real email.
      </p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function WaitlistPage() {
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [submitState, setSubmitState] = useState<SubmitState>({ status: 'idle', message: '' });
  const [totalCount, setTotalCount] = useState<number | null>(null);

  // Fetch public count for social proof
  useEffect(() => {
    fetch('/api/waitlist/stats/public')
      .then(r => r.json())
      .then(d => { if (d.success) setTotalCount(d.data.totalOnWaitlist); })
      .catch(() => { });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const toggleRole = (role: string) => {
    setForm(prev => ({
      ...prev,
      hiringRoles: prev.hiringRoles.includes(role)
        ? prev.hiringRoles.filter(r => r !== role)
        : [...prev.hiringRoles, role]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitState({ status: 'loading', message: '' });

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (res.status === 409) {
        setSubmitState({ status: 'duplicate', message: data.message, position: data.data?.position });
        return;
      }

      if (!res.ok || !data.success) {
        setSubmitState({ status: 'error', message: data.message || 'Something went wrong.' });
        return;
      }

      setSubmitState({ status: 'success', message: data.message, position: data.data?.position });

    } catch {
      setSubmitState({ status: 'error', message: 'Network error. Please try again.' });
    }
  };

  const isLoading = submitState.status === 'loading';
  const isSuccess = submitState.status === 'success';

  return (
    <main className="min-h-screen bg-[#faf9f7]">

      {/* ── Top bar ──────────────────────────────────────────────── */}
      <header className="border-b border-[#ede9e5] bg-white">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex-1">
            <Image src="/images/Vector.png" alt="JuniorForge" width={80} height={80} className='object-cover' />
          </div>
          <span className="text-xs text-[#646060] font-medium">
            Early Access
          </span>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-16 lg:py-24">
        <div className="grid lg:grid-cols-[1fr_420px] gap-16 lg:gap-20 items-start">

          {/* ── Left: Copy ──────────────────────────────────────── */}
          <div className="lg:sticky lg:top-16">

            {/* Status tag */}
            <div className="inline-flex items-center gap-2 mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-[#12895E]" />
              <span className="text-xs font-semibold tracking-widest uppercase text-[#12895E]">
                Now accepting early interest
              </span>
            </div>

            <h1 className="text-4xl lg:text-5xl font-bold text-[#16252D] leading-[1.1] tracking-tight mb-6">
              Hire junior talent
              <br />
              <span className="text-[#685EFC]">that's actually ready.</span>
            </h1>

            <p className="text-base text-[#3a3737] leading-relaxed mb-10 max-w-md">
              JuniorForge is a curated hiring platform for startups. Every developer in
              our pool has passed a rigorous technical and behavioural assessment before
              you see their profile. No noise. Just vetted talent.
            </p>

            {/* Feature list */}
            <ul className="space-y-4 mb-12">
              {[
                ['Technical scores, not just CVs', 'Every candidate is ranked by assessment tier before entering the pool.'],
                ['Behavioural AI matching', 'We analyse culture fit, work style, and soft skills, not just stack.'],
                ['Credit-based, no subscriptions', 'Pay per hire request. No retainers, no wasted budget.']
              ].map(([title, desc]) => (
                <li key={title} className="flex gap-4">
                  <div className="w-5 h-5 rounded shrink-0 bg-[#c1eddd] flex items-center justify-center mt-0.5">
                    <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                      <path d="M1 3.5L3.5 6L8 1" stroke="#12895E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#16252D] mb-0.5">{title}</p>
                    <p className="text-sm text-[#3a3737] leading-snug">{desc}</p>
                  </div>
                </li>
              ))}
            </ul>

            {/* Social proof */}
            {totalCount !== null && totalCount > 0 && (
              <div className="flex items-center gap-3 pt-8 border-t border-[#ede9e5]">
                {/* Avatars */}
                <div className="flex -space-x-2">
                  {['#685EFC', '#12895E', '#16252D'].map((color, i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center"
                      style={{ backgroundColor: color }}>
                      <span className="text-white text-[9px] font-bold">
                        {['S', 'F', 'J'][i]}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-[#6b6464]">
                  <strong className="text-[#16252D]">{totalCount.toLocaleString()} startups</strong>{' '}
                  already on the waitlist
                </p>
              </div>
            )}
          </div>

          {/* ── Right: Form card ─────────────────────────────────── */}
          <div>
            <div className="bg-white rounded-2xl border border-[#ede9e5] shadow-sm overflow-hidden">

              {/* Card header */}
              <div className="px-8 pt-8 pb-6 border-b border-[#f0ece8]">
                <h2 className="text-base font-bold text-[#16252D] tracking-tight">
                  Join the waitlist
                </h2>
                <p className="text-xs text-[#6b6767] mt-1">
                  We're opening access in batches. No spam, ever.
                </p>
              </div>

              <div className="px-8 py-8">
                {isSuccess ? (
                  <SuccessScreen position={submitState.position} email={form.email} />
                ) : submitState.status === 'duplicate' ? (
                  <div className="text-center py-6">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#f5f0ff] mb-4">
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <path d="M9 6v4M9 12.5v.5M3 9a6 6 0 1 0 12 0A6 6 0 0 0 3 9Z" stroke="#685EFC" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </div>
                    <h3 className="text-base font-bold text-[#16252D] mb-2">Already on the list</h3>
                    <p className="text-sm text-[#6b6464] leading-relaxed mb-1">{submitState.message}</p>
                    {submitState.position && (
                      <p className="text-xs text-[#685EFC] font-semibold">Your position: #{submitState.position}</p>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6" noValidate>

                    {/* Error banner */}
                    {submitState.status === 'error' && (
                      <div className="flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-100 rounded-lg">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-0.5 shrink-0">
                          <circle cx="8" cy="8" r="7" stroke="#ef4444" strokeWidth="1.5" />
                          <path d="M8 5v3.5M8 10.5v.5" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                        <p className="text-xs text-red-600 leading-relaxed">{submitState.message}</p>
                      </div>
                    )}

                    {/* Company name */}
                    <div>
                      <Label required>Company Name</Label>
                      <Input name="companyName" value={form.companyName}
                        onChange={handleChange} placeholder="Acme Inc."
                        required />
                    </div>

                    {/* Contact name + role */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label required>Your Name</Label>
                        <Input name="contactName" value={form.contactName}
                          onChange={handleChange} placeholder="Jane Smith"
                          required />
                      </div>
                      <div>
                        <Label required>Your Role</Label>
                        <Select name="contactRole" value={form.contactRole}
                          onChange={handleChange} options={ROLES}
                          placeholder="Select role" required />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <Label required>Work Email</Label>
                      <Input type="email" name="email" value={form.email}
                        onChange={handleChange}
                        placeholder="jane@company.io" required />
                    </div>

                    {/* Company size + industry */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label required>Company Size</Label>
                        <Select name="companySize" value={form.companySize}
                          onChange={handleChange} options={SIZES}
                          placeholder="Employees" required />
                      </div>
                      <div>
                        <Label>Industry</Label>
                        <Input name="industry" value={form.industry}
                          onChange={handleChange} placeholder="Fintech, SaaS…" />
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-[#f0ece8]" />

                    {/* Hiring roles */}
                    <div>
                      <Label>What roles are you hiring for?</Label>
                      <div className="flex flex-wrap gap-2">
                        {HIRING_ROLES.map(role => (
                          <Checkbox
                            key={role} label={role}
                            checked={form.hiringRoles.includes(role)}
                            onChange={() => toggleRole(role)}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Timeline */}
                    <div>
                      <Label>Hiring timeline</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {TIMELINES.map(t => (
                          <button key={t} type="button"
                            onClick={() => setForm(p => ({ ...p, hiringTimeline: p.hiringTimeline === t ? '' : t }))}
                            className={`
                              px-3 py-2.5 rounded-lg border text-xs font-medium text-left
                              transition-all duration-150
                              ${form.hiringTimeline === t
                                ? 'border-[#685EFC] bg-[#685EFC]/6 text-[#685EFC]'
                                : 'border-[#e8e4e0] text-[#888080] hover:border-[#685EFC]/40'
                              }
                            `}
                          >{t}</button>
                        ))}
                      </div>
                    </div>

                    {/* Referral */}
                    <div>
                      <Label>How did you hear about us?</Label>
                      <Select name="hearAboutUs" value={form.hearAboutUs}
                        onChange={handleChange} options={REFERRALS}
                        placeholder="Select one" />
                    </div>

                    {/* Submit */}
                    <button
                      type="submit" disabled={isLoading}
                      className={`
                        w-full py-3.5 rounded-xl text-sm font-semibold
                        tracking-wide transition-all duration-200
                        ${isLoading
                          ? 'bg-[#685EFC]/60 text-white cursor-not-allowed'
                          : 'bg-[#685EFC] text-white hover:bg-[#5a51e0] active:scale-[0.99]'
                        }
                      `}
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeOpacity="0.25" />
                            <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
                          </svg>
                          Submitting…
                        </span>
                      ) : 'Request Early Access →'}
                    </button>

                    <p className="text-center text-xs text-[#c4bcb8] leading-snug">
                      No credit card. No spam. Unsubscribe anytime.
                    </p>

                  </form>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="border-t border-[#ede9e5] mt-8">
        <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex-1">
            <Image src="/images/Vector.png" alt="JuniorForge" width={80} height={80} className='object-cover' />
          </div>
          <p className="text-xs text-[#A49595]">
            © {new Date().getFullYear()} JuniorForge · Built for startups that hire with intention
          </p>
        </div>
      </footer>
    </main>
  );
}