import { Link } from "react-router-dom";

const pages = {
  privacy: {
    title: "Privacy notice", intro: "How church and payment information is handled in Church Pledge Manager",
    sections: [
      ["Information we use", "A church administrator enters their name, email and church name to create an account. Church staff add member names, phone numbers, groups, pledges and collection records. We also keep payment references, amounts, status and the payment method returned by Pesapal."],
      ["Why we use it", "This information allows the church to manage pledges, report on collections and send requested SMS reminders. The church is responsible for obtaining appropriate permission from its members before entering their details or contacting them."],
      ["Online payments", "When a member chooses to pay, we send them to Pesapal. Payment credentials, card numbers and mobile money PINs are entered on Pesapal, not on this site. We receive a transaction status, reference and payment method so the church can reconcile its records. The church should confirm its settlement account and agreement with Pesapal before accepting payments."],
      ["Who can see the data", "Authorized church staff can see their own church's records. Payment links show only the church, campaign and amount needed to pay. We do not sell member information."],
      ["Storage and requests", "Application records are stored in a hosted PostgreSQL database. Contact your church administrator to correct or remove member details. For account or privacy questions, use the contact details supplied by your church. Do not send payment card details by email or SMS."],
    ],
  },
  terms: {
    title: "Terms of use", intro: "Please read these terms before creating a church workspace or making a payment",
    sections: [
      ["Church accounts", "The person registering a church confirms they are authorized to manage its pledge records. Keep sign in credentials private and give access only to trusted staff."],
      ["Accurate records", "Church staff are responsible for entering accurate member, campaign and pledge details. The application is a recordkeeping tool and does not replace the church's accounting, audit or reconciliation processes."],
      ["Payments", "A payment is sent through Pesapal and is recorded as collected only after its status is checked with Pesapal. The church must verify that its Pesapal merchant account settles into the intended church bank or mobile money account. Fees, settlement timing, refunds and disputes are governed by the church's arrangement with Pesapal."],
      ["Availability", "Services may occasionally be delayed by hosting, mobile networks or payment providers. Do not submit another payment solely because a confirmation screen is slow. Check the payment status or contact the church first."],
      ["Appropriate use", "Do not access another church's information, share payment links for a different purpose or try to bypass security controls."],
    ],
  },
  cookies: {
    title: "Cookie and browser storage notice", intro: "The small amount of browser storage used by this application",
    sections: [
      ["Essential storage", "The application stores the signed in session in your browser so you can move between pages. It stores your privacy choice so the notice does not reappear on every visit."],
      ["Optional tracking", "This application does not set advertising or analytics cookies. Choosing Essential only keeps only the storage required for sign in and your choice."],
      ["Your control", "You can sign out to end your session and clear this site's browser data in your browser settings. Clearing the data also resets your privacy choice."],
      ["Pesapal", "If you choose an online payment, Pesapal opens on its own site and may use its own cookies. Review Pesapal's notice before entering payment details."],
    ],
  },
} as const;

export function LegalPage({ kind }: { kind: keyof typeof pages }) {
  const page = pages[kind];
  return <main className="min-h-screen bg-slate-50"><header className="border-b border-line bg-white"><div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-5 sm:px-6"><Link to="/" className="font-bold text-navy">Church Pledge Manager</Link><Link to="/login" className="text-sm font-semibold text-navy">Sign in</Link></div></header><div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16"><p className="text-sm font-semibold uppercase tracking-widest text-gold">Information and trust</p><h1 className="mt-3 text-3xl font-bold text-navy sm:text-5xl">{page.title}</h1><p className="mt-4 max-w-2xl text-lg text-muted">{page.intro}</p><div className="mt-10 grid gap-8 lg:grid-cols-[220px_1fr]"><nav aria-label="Legal pages" className="flex flex-wrap gap-3 self-start lg:grid"><Link to="/privacy" className="text-sm font-semibold text-navy underline">Privacy</Link><Link to="/terms" className="text-sm font-semibold text-navy underline">Terms of use</Link><Link to="/cookies" className="text-sm font-semibold text-navy underline">Cookies</Link></nav><div className="space-y-4">{page.sections.map(([heading, content]) => <section key={heading} className="card"><h2 className="text-lg font-semibold text-navy">{heading}</h2><p className="mt-3 leading-7 text-slate-600">{content}</p></section>)}</div></div></div><footer className="border-t border-line bg-white px-4 py-8 text-center text-sm text-muted">Church Pledge Manager</footer></main>;
}
