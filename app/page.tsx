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

// ─── How It Works ─────────────────────────────────────────────────────────────

const HOW_IT_WORKS = [
  {
    number: '01',
    title: 'We assess the talent before you ever see them',
    body: "Every developer in our pool completes a structured technical assessment and a behavioural evaluation. We score communication, problem-solving, adaptability, and culture fit, not just whether they can write code.",
    accent: '#685EFC',
  },
  {
    number: '02',
    title: "You tell us what your startup actually needs",
    body: "Tech stack, team size, stage, the kind of problems you're solving. The more specific you are, the sharper the match. This isn't a job board where you sift through 200 applications.",
    accent: '#12895E',
  },
  {
    number: '03',
    title: 'We match, you get access to a shortlist, not a pile',
    body: 'Our AI-assisted matching engine aligns assessed talent against your specific criteria. You receive a curated shortlist of developers who are ready, vetted, and actually suited for where you are right now.',
    accent: '#37ffb7',
  },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold tracking-widest uppercase text-[#292727] mb-2">
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
      className="w-full px-4 py-3 text-sm text-[#16252D] bg-white border border-[#e8e4e0] rounded-lg outline-none placeholder:text-[#c4bcb8] focus:border-[#685EFC] focus:ring-2 focus:ring-[#685EFC]/10 transition-all duration-150"
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
      className={`w-full px-4 py-3 text-sm rounded-lg border border-[#e8e4e0] bg-white outline-none appearance-none focus:border-[#685EFC] focus:ring-2 focus:ring-[#685EFC]/10 transition-all duration-150 ${value ? 'text-[#16252D]' : 'text-[#c4bcb8]'}`}
    >
      <option value="" disabled hidden>{placeholder}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button" onClick={onChange}
      className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border text-sm transition-all duration-150 text-left ${checked ? 'border-[#685EFC] bg-[#685EFC]/6 text-[#16252D] font-medium' : 'border-[#e8e4e0] text-[#888080] hover:border-[#685EFC]/50 hover:text-[#16252D]'}`}
    >
      <span className={`w-4 h-4 shrink-0 rounded border flex items-center justify-center transition-all duration-150 ${checked ? 'bg-[#685EFC] border-[#685EFC]' : 'border-[#d0c8c4]'}`}>
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
          <span className="text-xs font-semibold text-[#685EFC] tracking-wide">#{position} on the waitlist</span>
        </div>
      )}
      <h2 className="text-2xl font-bold text-[#16252D] tracking-tight mb-3">You're in.</h2>
      <p className="text-[#6b6464] text-sm leading-relaxed max-w-xs mx-auto mb-2">
        We've reserved your spot and sent a confirmation to <strong className="text-[#16252D]">{email}</strong>.
      </p>
      <p className="text-[#292727] text-xs leading-relaxed max-w-65 mx-auto">
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

      {/* Header */}
      <header className="border-b border-[#ede9e5] bg-white sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex-1">
            <Image src="/images/Vector.png" alt="JuniorForge" width={80} height={80} className='object-cover' />
          </div>
          <span className="text-xs text-[#292727] font-medium">Early Access</span>
        </div>
      </header>

      {/* Hero */}
      <div className="max-w-5xl mx-auto px-6 py-16 lg:py-24">
        <div className="grid lg:grid-cols-[1fr_420px] gap-16 lg:gap-20 items-start">

          {/* Left: Copy */}
          <div className="lg:sticky lg:top-24">
            <div className="inline-flex items-center gap-2 mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-[#12895E] animate-pulse" />
              <span className="text-xs font-semibold tracking-widest uppercase text-[#12895E]">
                Now accepting early interest
              </span>
            </div>

            <h1 className="text-4xl lg:text-5xl font-bold text-[#16252D] leading-[1.1] tracking-tight mb-6">
              Stop sifting.<br />
              <span className="text-[#685EFC]">Start matching.</span>
            </h1>

            <p className="text-base text-[#292727] leading-relaxed mb-4 max-w-md">
              JuniorForge matches vetted junior developers with early-stage startups.
              Every developer in our pool has already been assessed, technically and
              behaviourally, before you ever see their name.
            </p>
            <p className="text-base text-[#292727] leading-relaxed mb-10 max-w-md">
              You don't get a job board. You get a curated shortlist built specifically
              around your stack, your team, and where your startup actually is right now.
            </p>

            {/* Talent pool stat */}
            <div className="flex items-center gap-4 mb-10 p-4 bg-white border border-[#ede9e5] rounded-xl">
              <div className="shrink-0 w-12 h-12 rounded-xl bg-[#685EFC]/10 flex items-center justify-center">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="#685EFC" strokeWidth="1.8" strokeLinecap="round" />
                  <circle cx="9" cy="7" r="4" stroke="#685EFC" strokeWidth="1.8" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="#685EFC" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#16252D] leading-none mb-1">500+</p>
                <p className="text-xs text-[#292727] leading-snug">
                  Assessed developers already in the pool,<br />ready to be matched to your startup
                </p>
              </div>
            </div>

            {/* Features */}
            <ul className="space-y-5 mb-12">
              {[
                { title: 'AI-powered technical assessment', desc: "Every candidate is tested against real engineering challenges before entering the pool. No self-reported skills.", c: '#c1eddd', s: '#12895E' },
                { title: 'Behavioural matching, not just stack', desc: "We assess communication, adaptability, and work style. Culture fit isn't an afterthought here, it's baked into every match.", c: '#e8e5ff', s: '#685EFC' },
                { title: "Matched to your startup's stage", desc: 'A developer who thrives at a 5-person seed startup is different from one suited to a 50-person Series B. We know the difference.', c: '#d0f0e8', s: '#12895E' },
                { title: 'No recruiters. No retainers. No noise.', desc: "You join the waitlist, tell us what you need, and we do the matching. Simple, fast, and built for founders who don't have time to waste.", c: '#c1eddd', s: '#12895E' },
              ].map(({ title, desc, c, s }) => (
                <li key={title} className="flex gap-4">
                  <div className="w-5 h-5 rounded shrink-0 flex items-center justify-center mt-0.5" style={{ backgroundColor: c }}>
                    <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                      <path d="M1 3.5L3.5 6L8 1" stroke={s} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#16252D] mb-0.5">{title}</p>
                    <p className="text-sm text-[#292727] leading-snug">{desc}</p>
                  </div>
                </li>
              ))}
            </ul>

            {/* Social proof */}
            {totalCount !== null && totalCount > 0 && (
              <div className="flex items-center gap-3 pt-8 border-t border-[#ede9e5]">
                <div className="flex -space-x-2">
                  {['#685EFC', '#12895E', '#16252D'].map((color, i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center" style={{ backgroundColor: color }}>
                      <span className="text-white text-[9px] font-bold">{['S', 'F', 'J'][i]}</span>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-[#6b6464]">
                  <strong className="text-[#16252D]">{totalCount.toLocaleString()} startups</strong>{' '}already on the waitlist
                </p>
              </div>
            )}
          </div>

          {/* Right: Form */}
          <div>
            <div className="bg-white rounded-2xl border border-[#ede9e5] shadow-sm overflow-hidden">
              <div className="px-8 pt-8 pb-6 border-b border-[#f0ece8]">
                <h2 className="text-base font-bold text-[#16252D] tracking-tight">Join the waitlist</h2>
                <p className="text-xs text-[#292727] mt-1">We're opening access in batches. No spam, ever.</p>
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

                    {submitState.status === 'error' && (
                      <div className="flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-100 rounded-lg">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-0.5 shrink-0">
                          <circle cx="8" cy="8" r="7" stroke="#ef4444" strokeWidth="1.5" />
                          <path d="M8 5v3.5M8 10.5v.5" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                        <p className="text-xs text-red-600 leading-relaxed">{submitState.message}</p>
                      </div>
                    )}

                    <div>
                      <Label required>Company Name</Label>
                      <Input name="companyName" value={form.companyName} onChange={handleChange} placeholder="Acme Inc." required />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label required>Your Name</Label>
                        <Input name="contactName" value={form.contactName} onChange={handleChange} placeholder="Jane Smith" required />
                      </div>
                      <div>
                        <Label required>Your Role</Label>
                        <Select name="contactRole" value={form.contactRole} onChange={handleChange} options={ROLES} placeholder="Select role" required />
                      </div>
                    </div>

                    <div>
                      <Label required>Work Email</Label>
                      <Input type="email" name="email" value={form.email} onChange={handleChange} placeholder="jane@company.io" required />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label required>Company Size</Label>
                        <Select name="companySize" value={form.companySize} onChange={handleChange} options={SIZES} placeholder="Employees" required />
                      </div>
                      <div>
                        <Label>Industry</Label>
                        <Input name="industry" value={form.industry} onChange={handleChange} placeholder="Fintech, SaaS…" />
                      </div>
                    </div>

                    <div className="border-t border-[#f0ece8]" />

                    <div>
                      <Label>What roles are you hiring for?</Label>
                      <div className="flex flex-wrap gap-2">
                        {HIRING_ROLES.map(role => (
                          <Checkbox key={role} label={role} checked={form.hiringRoles.includes(role)} onChange={() => toggleRole(role)} />
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label>Hiring timeline</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {TIMELINES.map(t => (
                          <button key={t} type="button"
                            onClick={() => setForm(p => ({ ...p, hiringTimeline: p.hiringTimeline === t ? '' : t }))}
                            className={`px-3 py-2.5 rounded-lg border text-xs font-medium text-left transition-all duration-150 ${form.hiringTimeline === t ? 'border-[#685EFC] bg-[#685EFC]/6 text-[#685EFC]' : 'border-[#e8e4e0] text-[#888080] hover:border-[#685EFC]/40'}`}
                          >{t}</button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label>How did you hear about us?</Label>
                      <Select name="hearAboutUs" value={form.hearAboutUs} onChange={handleChange} options={REFERRALS} placeholder="Select one" />
                    </div>

                    <button
                      type="submit" disabled={isLoading}
                      className={`w-full py-3.5 rounded-xl text-sm font-semibold tracking-wide transition-all duration-200 ${isLoading ? 'bg-[#685EFC]/60 text-white cursor-not-allowed' : 'bg-[#685EFC] text-white hover:bg-[#5a51e0] active:scale-[0.99]'}`}
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
                      No credit card. No spam.{' '}
                      By joining you agree to our{' '}
                      <a href="/terms" className="underline text-[#292727] hover:text-[#685EFC] transition-colors">Terms</a>
                      {' '}and{' '}
                      <a href="/privacy" className="underline text-[#292727] hover:text-[#685EFC] transition-colors">Privacy Policy</a>.
                    </p>

                  </form>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* How It Works */}
      <section className="border-t border-[#ede9e5] bg-white">
        <div className="max-w-5xl mx-auto px-6 py-16 lg:py-20">
          <div className="mb-12">
            <p className="text-xs font-semibold tracking-widest uppercase text-[#685EFC] mb-3">How It Works</p>
            <h2 className="text-2xl lg:text-3xl font-bold text-[#16252D] leading-tight tracking-tight max-w-lg">
              This isn't a job board.<br />It's a matching engine.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map(({ number, title, body, accent }) => (
              <div key={number} className="p-6 rounded-2xl border border-[#ede9e5] bg-[#faf9f7]">
                <span className="text-3xl font-bold mb-4 block" style={{ color: accent }}>{number}</span>
                <h3 className="text-sm font-bold text-[#16252D] leading-snug mb-3">{title}</h3>
                <p className="text-sm text-[#292727] leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section className="border-t border-[#ede9e5] bg-[#faf9f7]">
        <div className="max-w-5xl mx-auto px-6 py-16 lg:py-20">
          <div className="mb-10">
            <p className="text-xs font-semibold tracking-widest uppercase text-[#685EFC] mb-3">Who It's For</p>
            <h2 className="text-2xl lg:text-3xl font-bold text-[#16252D] leading-tight tracking-tight">Built for startups of any size and stage</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { title: "You're building with a small team", desc: "Every hire matters. A wrong one sets you back months. You need someone who can ramp fast, wear multiple hats, and figure things out — not just follow tickets." },
              { title: "You don't have time to screen 200 CVs", desc: "Founders build products. They don't have weeks to spend on hiring pipelines. JuniorForge does the screening, so your time goes into the conversations that actually matter." },
              { title: "You've been burned by the wrong hire before", desc: "Skills on a CV don't predict startup fit. Behavioural assessment does. We test for the traits that actually correlate with success in fast-moving, ambiguous environments." },
              { title: "You want to hire intentionally, not desperately", desc: "The best time to build your hiring pipeline is before you urgently need to fill a role. Join now, tell us what you need, and we'll have options ready when the moment comes." },
            ].map(({ title, desc }) => (
              <div key={title} className="flex gap-4 p-5 bg-white rounded-xl border border-[#ede9e5]">
                <div className="w-5 h-5 rounded-full shrink-0 bg-[#c1eddd] flex items-center justify-center mt-0.5">
                  <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                    <path d="M1 3.5L3.5 6L8 1" stroke="#12895E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#16252D] mb-1">{title}</p>
                  <p className="text-sm text-[#292727] leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-[#16252D]">
        <div className="max-w-5xl mx-auto px-6 py-14 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-bold text-white mb-2 tracking-tight">500+ developers assessed and ready.</h2>
            <p className="text-sm text-[#8aa8b2] leading-relaxed max-w-md">
              The supply side is built. Now we're opening access to the startup side, in controlled batches, so every match is a good one.
            </p>
          </div>
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="shrink-0 px-6 py-3 bg-[#685EFC] text-white text-sm font-semibold rounded-xl hover:bg-[#5a51e0] transition-colors duration-200 whitespace-nowrap"
          >
            Request Early Access →
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#ede9e5] bg-white">
        <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex-1">
            <Image src="/images/Vector.png" alt="JuniorForge" width={80} height={80} className='object-cover' />
          </div>
          <div className="flex items-center gap-6">
            <a href="https://juniorforge.com/privacy-policy" target='_blank' className="text-xs text-[#292727] hover:text-[#685EFC] transition-colors">Privacy Policy</a>
            <a href="https://juniorforge.com/terms-conditions" target='_blank' className="text-xs text-[#292727] hover:text-[#685EFC] transition-colors">Terms &amp; Conditions</a>
          </div>
          <p className="text-xs text-[#292727]">© {new Date().getFullYear()} JuniorForge · Registered in the UK &amp; Nigeria</p>
        </div>
      </footer>

    </main>
  );
}