import { useState } from 'react';
import { Mail } from 'lucide-react';
import InfoPage from '../../components/InfoPage';

// Set VITE_CONTACT_EMAIL in .env.local. The form opens the visitor's email app
// with the message pre-filled (no backend needed).
const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL;

const inputClass =
  'w-full rounded-md border border-ink/10 bg-ink/5 px-3 py-2 text-sm outline-none focus:border-crimson-500';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!CONTACT_EMAIL) return;
    const subject = form.subject || 'CineLookUp enquiry';
    const body = `${form.message}\n\n— ${form.name} (${form.email})`;
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <InfoPage title="Contact Us" subtitle="Questions, bug reports or feedback? We'd like to hear it.">
      {!CONTACT_EMAIL && (
        <p className="rounded-md border border-crimson-500/40 bg-crimson-600/10 px-4 py-3 text-sm text-ink/70">
          Contact email isn't configured yet. Add <code>VITE_CONTACT_EMAIL</code> to your <code>.env.local</code>.
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-ink/10 bg-card p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block text-ink/60">Name</span>
            <input required value={form.name} onChange={set('name')} className={inputClass} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-ink/60">Your email</span>
            <input required type="email" value={form.email} onChange={set('email')} className={inputClass} />
          </label>
        </div>
        <label className="block text-sm">
          <span className="mb-1 block text-ink/60">Subject</span>
          <input value={form.subject} onChange={set('subject')} className={inputClass} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-ink/60">Message</span>
          <textarea required rows={6} value={form.message} onChange={set('message')} className={inputClass} />
        </label>
        <button
          type="submit"
          disabled={!CONTACT_EMAIL}
          className="flex items-center gap-2 rounded-md bg-crimson-600 px-5 py-2.5 text-sm font-semibold hover:bg-crimson-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Mail size={15} /> Send Message
        </button>
      </form>
    </InfoPage>
  );
}