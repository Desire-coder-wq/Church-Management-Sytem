import { useState } from "react";
import { Link } from "react-router-dom";

const preferenceKey = "church-pledge-cookie-choice";
export function CookieNotice() {
  const [choice, setChoice] = useState(() => localStorage.getItem(preferenceKey));
  if (choice) return null;
  function save(value: string) { localStorage.setItem(preferenceKey, value); setChoice(value); }
  return <aside role="dialog" aria-label="Storage preference" className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-3xl rounded-xl border border-line bg-white p-4 shadow-xl sm:p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-semibold text-navy">Your privacy choices</h2><p className="mt-1 text-sm text-muted">We use browser storage to keep your sign in and privacy choice. We do not use advertising cookies. Read our <Link className="underline" to="/cookies">cookie notice</Link></p></div><div className="flex shrink-0 gap-2"><button className="btn border border-line text-sm" onClick={() => save("essential")}>Essential only</button><button className="btn primary text-sm" onClick={() => save("accepted")}>Accept</button></div></div></aside>;
}
