import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Church, ArrowLeft } from 'lucide-react';
import { api, getError } from '../../api/client';
import { useAuthStore } from '../../stores/auth-store';

export function AuthForm({ signup = false }: { signup?: boolean }) {
  const [form, setForm] = useState({ churchName: '', fullName: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState('');
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const setSession = useAuthStore(state => state.setSession);
  async function submit(event: FormEvent) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (signup && form.churchName.trim().length < 2) next.churchName = 'Enter your church name (at least 2 characters).';
    if (signup && form.fullName.trim().length < 2) next.fullName = 'Enter your full name (at least 2 characters).';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Enter a valid email address.';
    if (!form.password) next.password = 'Enter your password.';
    else if (signup && (form.password.length < 8 || !/[a-z]/.test(form.password) || !/[A-Z]/.test(form.password) || !/[0-9]/.test(form.password))) next.password = 'Use 8 or more characters, uppercase and lowercase letters, and a number.';
    if (signup && (!form.confirmPassword || form.confirmPassword !== form.password)) next.confirmPassword = 'Enter the same password again.';
    setErrors(next); setNotice('');
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      const payload = signup ? { churchName: form.churchName.trim(), fullName: form.fullName.trim(), email: form.email.trim().toLowerCase(), password: form.password }
        : { email: form.email.trim().toLowerCase(), password: form.password };
      const { data } = await api.post(signup ? '/auth/signup' : '/auth/login', payload);
      setSession(data.accessToken, data.user); navigate('/dashboard');
    } catch (error) { setNotice(getError(error)); } finally { setBusy(false); }
  }
  const names: (keyof typeof form)[] = signup ? ['churchName', 'fullName', 'email', 'password', 'confirmPassword'] : ['email', 'password'];
  const labels = { churchName: 'Church name', fullName: 'Administrator full name', email: 'Email address', password: 'Password', confirmPassword: 'Confirm password' };
  return <main className="min-h-screen lg:grid lg:grid-cols-2">
    <aside className="hidden bg-navy p-16 text-white lg:flex lg:flex-col lg:justify-between"><Link to="/" className="flex items-center gap-3 text-xl font-semibold"><Church className="text-gold" />Church Pledge</Link>
      <div><p className="mb-5 text-sm font-semibold uppercase tracking-widest text-gold">Built for your ministry</p><h1 className="text-5xl font-bold leading-tight">Steward every pledge.<br />Support every purpose.</h1><p className="mt-6 leading-7 text-slate-300">Your members, campaigns and collections in one organized church workspace.</p></div><p className="text-sm text-slate-300">Clear records. Confident decisions.</p></aside>
    <section className="flex items-center justify-center px-6 py-10"><div className="w-full max-w-md"><Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm text-muted"><ArrowLeft size={16} />Back to home</Link>
      <h2 className="text-3xl font-bold">{signup ? 'Register your church' : 'Welcome back'}</h2><p className="mt-3 mb-8 text-muted">{signup ? 'Create your workspace and administrator account.' : 'Sign in to your church workspace.'}</p>
      {notice && <p role="alert" className="mb-5 rounded-lg bg-red-50 p-3 text-sm text-danger">{notice}</p>}
      <form noValidate onSubmit={submit} className="space-y-5">{names.map(name => <div key={name}><label htmlFor={name} className="text-sm font-medium">{labels[name]}</label><div className="relative"><input id={name} className={`field ${errors[name] ? 'border-red-500' : ''}`} type={name === 'email' ? 'email' : name === 'confirmPassword' || (name === 'password' && !visible) ? 'password' : 'text'} value={form[name]} aria-invalid={!!errors[name]} aria-describedby={`${name}-help`} autoComplete={name === 'password' ? (signup ? 'new-password' : 'current-password') : name === 'email' ? 'email' : 'off'} onChange={event => setForm({ ...form, [name]: event.target.value })} />{name === 'password' && <button type="button" className="absolute right-3 top-4 text-muted" aria-label={visible ? 'Hide password' : 'Show password'} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button>}</div>
        <p id={`${name}-help`} className={`mt-1 text-xs ${errors[name] ? 'text-danger' : 'text-muted'}`}>{errors[name] || (name === 'password' && signup ? '8+ characters, uppercase and lowercase letters, and a number.' : '')}</p></div>)}
        <button disabled={busy} className="btn primary w-full py-3">{busy ? 'Please wait…' : signup ? 'Create church workspace' : 'Sign in'}</button>
      </form><p className="mt-7 text-center text-sm text-muted">{signup ? 'Already have an account?' : 'New church?'} <Link to={signup ? '/login' : '/signup'} className="font-semibold text-navy underline underline-offset-4">{signup ? 'Sign in' : 'Register your church'}</Link></p>
    </div></section>
  </main>;
}
