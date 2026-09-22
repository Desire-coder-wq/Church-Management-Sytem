export function LandingPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <header className="mx-auto flex max-w-6xl justify-between p-6">
        <b className="text-navy">Church Pledge Manager</b>
        <a className="btn primary" href="/login">
          Sign in
        </a>
      </header>
      <section className="mx-auto max-w-6xl px-6 py-20">
        <p className="font-semibold text-gold">FUNDRAISING MADE CLEAR</p>
        <h1 className="mt-4 max-w-3xl text-4xl font-bold md:text-6xl">
          Every pledge. Every collection. One trusted record.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted">
          A secure workspace for church staff to manage members, campaigns,
          payments and reminders.
        </p>
        <a className="btn primary mt-8 inline-block" href="/signup">
          Get started
        </a>
      </section>
    </main>
  );
}