import { Link } from "react-router-dom";
import { ArrowRight, Bell, ChartNoAxesCombined, Church, CreditCard, HeartHandshake, Users } from "lucide-react";
import churchImage from "../../Assets/Images/Church.jpg";
import { api } from "../api/client";
import { useEffect } from "react";

const features = [
  { title: "Members", description: "Keep member names, phone numbers and church groups in one place", Icon: Users },
  { title: "Pledges", description: "See what has been promised, paid and is still due", Icon: HeartHandshake },
  { title: "Payments", description: "Offer a Pesapal payment link and record verified payments", Icon: CreditCard },
  { title: "Reports", description: "Review collections and export the records your team needs", Icon: ChartNoAxesCombined },
];
export function LandingPage() {
  useEffect(() => { void api.get("/health", { timeout: 90_000 }).catch(() => undefined); }, []);
  return <main className="min-h-screen bg-slate-50 text-ink">
    <header className="border-b border-line bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6"><Link to="/" className="flex items-center gap-2 font-bold text-navy sm:text-lg"><Church className="h-6 w-6 shrink-0 text-gold" />Church Pledge Manager</Link><Link to="/login" className="rounded-lg border border-navy px-4 py-2 text-sm font-semibold text-navy hover:bg-slate-50">Sign in</Link></div></header>
    <section className="mx-auto grid max-w-7xl items-center gap-9 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-2 lg:gap-14 lg:py-20"><div><p className="text-sm font-bold uppercase tracking-widest text-gold">For church teams</p><h1 className="mt-5 text-4xl font-bold leading-tight text-navy sm:text-5xl lg:text-6xl">Give every pledge a clear record</h1><p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">Manage members and campaigns, follow up on pledges and see collections as they happen. Keep your church team informed without losing track of the details</p><div className="mt-8 flex flex-wrap gap-3"><Link to="/signup" className="btn primary inline-flex items-center gap-2 px-6 py-3">Register your church <ArrowRight size={18} /></Link><Link to="/login" className="btn inline-flex items-center border border-line bg-white px-6 py-3 text-navy">Sign in</Link></div><div className="mt-9 flex items-start gap-3 rounded-xl border border-line bg-white p-4 text-sm text-slate-600"><Bell size={18} className="shrink-0 text-gold" /><p>Send reminders and view a clear payment history for each pledge</p></div></div><img src={churchImage} alt="Church building" className="h-64 w-full rounded-2xl object-cover sm:h-96 lg:h-[470px]" /></section>
    <section className="border-t border-line bg-white px-4 py-14 sm:px-6"><div className="mx-auto max-w-7xl"><h2 className="text-2xl font-bold text-navy sm:text-3xl">The work your team does, in one place</h2><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{features.map(({ title, description, Icon }) => <div key={title} className="rounded-xl border border-line bg-white p-5"><span className="inline-flex rounded-lg bg-slate-100 p-3 text-navy"><Icon size={22} /></span><h3 className="mt-5 font-semibold text-navy">{title}</h3><p className="mt-2 text-sm leading-6 text-muted">{description}</p></div>)}</div></div></section>
    <footer className="bg-navy px-4 py-9 text-white sm:px-6"><div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold">Church Pledge Manager</p><p className="mt-1 text-sm text-slate-300">Clear giving records for church teams</p></div><nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2 text-sm"><Link to="/privacy" className="hover:text-gold">Privacy</Link><Link to="/terms" className="hover:text-gold">Terms of use</Link><Link to="/cookies" className="hover:text-gold">Cookies</Link></nav></div></footer>
  </main>;
}
