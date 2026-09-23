import { FormEvent, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, getError } from "../api/client";
import { ugx } from "../utils/currency";

type Pledge = { id: string; balance: number; member: { fullName: string }; campaign: { name: string } };
type PaymentLink = { id: string; publicToken: string; merchantReference: string; amount: number; status: string; gatewayMethod?: string; createdAt: string; pledge: Pledge };

export function PaymentsPage() {
  const [searchParams] = useSearchParams();
  const [pledges, setPledges] = useState<Pledge[]>([]);
  const [links, setLinks] = useState<PaymentLink[]>([]);
  const [pledgeId, setPledgeId] = useState(searchParams.get("pledge") ?? "");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const [pledgeResponse, linkResponse] = await Promise.all([api.get("/pledges"), api.get("/payments/links")]);
      setPledges(pledgeResponse.data.filter((row: Pledge) => row.balance > 0));
      setLinks(linkResponse.data);
    } catch (failure) { setError(getError(failure)); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);
  const selected = pledges.find((item) => item.id === pledgeId);

  async function create(event: FormEvent) {
    event.preventDefault();
    setError(""); setSuccess("");
    const value = Number(amount);
    if (!selected) return setError("Choose a pledge with an outstanding balance");
    if (!/^\d+(\.\d{1,2})?$/.test(amount) || value < 1) return setError("Enter a valid amount of at least UGX 1");
    if (value > selected.balance) return setError(`Amount cannot exceed ${ugx(selected.balance)}`);
    setBusy(true);
    try {
      const { data } = await api.post("/payments/links", { pledgeId, amount: value });
      setSuccess(`Payment link ready for ${selected.member.fullName}`);
      setLinks((existing) => [data, ...existing.filter((item) => item.id !== data.id)]);
      setAmount("");
      await load();
    } catch (failure) { setError(getError(failure)); }
    finally { setBusy(false); }
  }

  async function copy(token: string) {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/pay/${token}`);
      setSuccess("Payment link copied"); setError("");
    } catch { setError("Copy failed. Open the link and copy the address from your browser"); }
  }

  return <div className="space-y-6">
    <div><h1 className="page-title">Online payments</h1><p className="page-subtitle">Create a secure link for a pledge. A collection is recorded only after Pesapal confirms payment</p></div>
    {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-danger">{error}</p>}
    {success && <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-success">{success}</p>}
    <form onSubmit={create} noValidate className="card grid gap-4 md:grid-cols-[1fr_180px_auto] md:items-end">
      <div><label htmlFor="payment-pledge" className="form-label">Pledge</label><select id="payment-pledge" className="field" value={pledgeId} onChange={(event) => { setPledgeId(event.target.value); setAmount(""); }}><option value="">Choose a pledge</option>{pledges.map((pledge) => <option key={pledge.id} value={pledge.id}>{pledge.member.fullName} · {pledge.campaign.name} · {ugx(pledge.balance)} due</option>)}</select></div>
      <div><label htmlFor="payment-amount" className="form-label">Amount in UGX</label><input id="payment-amount" className="field" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder={selected ? String(selected.balance) : "50000"} /></div>
      <button className="btn primary" disabled={busy}>{busy ? "Creating link…" : "Create payment link"}</button>
    </form>
    <section className="card"><h2 className="section-title">Payment links</h2>{loading ? <p>Loading payments…</p> : links.length === 0 ? <p className="text-muted">No payment links yet</p> : <div className="space-y-3">{links.map((link) => <div key={link.id} className="flex flex-col gap-3 rounded-lg border border-line p-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="font-semibold">{link.pledge?.member?.fullName} · {ugx(Number(link.amount))}</p><p className="text-sm text-muted">{link.pledge?.campaign?.name} · {link.gatewayMethod || "Payment method pending"}</p><p className="break-all text-xs text-muted">{link.merchantReference}</p></div><div className="flex flex-wrap items-center gap-3"><span className="text-sm font-medium text-navy">{link.status.replaceAll("_", " ")}</span><Link className="text-sm font-semibold text-navy underline" to={`/pay/${link.publicToken}`}>Open</Link><button className="text-sm font-semibold text-navy underline" onClick={() => void copy(link.publicToken)}>Copy link</button></div></div>)}</div>}</section>
  </div>;
}
