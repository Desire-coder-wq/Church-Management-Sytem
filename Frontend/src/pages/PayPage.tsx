import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, getError } from "../api/client";
import { ugx } from "../utils/currency";

type Payment = { churchName: string; campaignName: string; amount: number; status: string; expired: boolean };
export function PayPage() {
  const { token } = useParams();
  const [payment, setPayment] = useState<Payment>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (token) api.get(`/payments/public/${encodeURIComponent(token)}`).then((response) => setPayment(response.data)).catch((failure) => setError(getError(failure))); }, [token]);
  async function checkout() {
    setBusy(true); setError("");
    try {
      const { data } = await api.post(`/payments/public/${encodeURIComponent(token ?? "")}/checkout`);
      const destination = new URL(data.redirectUrl);
      if (destination.protocol !== "https:" || !/(^|\.)pesapal\.com$/.test(destination.hostname)) throw new Error("Invalid payment address");
      window.location.assign(destination.toString());
    } catch (failure) { setError(getError(failure)); setBusy(false); }
  }
  return <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4"><section className="card w-full max-w-lg p-6 sm:p-9"><Link to="/" className="text-sm font-semibold text-navy">Church Pledge Manager</Link><h1 className="mt-8 text-3xl font-bold text-navy">Pay a pledge</h1>{error && <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-danger">{error}</p>}{!payment && !error && <p className="mt-5 text-muted">Loading payment details…</p>}{payment && <><div className="my-7 space-y-4 rounded-lg border border-line p-5"><p><span className="block text-sm text-muted">Church</span><strong>{payment.churchName}</strong></p><p><span className="block text-sm text-muted">Campaign</span><strong>{payment.campaignName}</strong></p><p><span className="block text-sm text-muted">Amount</span><strong className="break-words text-2xl text-navy">{ugx(payment.amount)}</strong></p></div>{payment.expired || ["COMPLETED", "REVERSED"].includes(payment.status) ? <p className="text-muted">This payment link is no longer available. Ask the church for a new link</p> : <><button disabled={busy} onClick={() => void checkout()} className="btn primary w-full py-3">{busy ? "Opening Pesapal…" : "Continue to Pesapal"}</button><p className="mt-4 text-sm text-muted">You will choose your payment method on Pesapal. This site does not collect your card or mobile money PIN</p></>}</>}</section></main>;
}
