import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, getError } from "../api/client";
import { ugx } from "../utils/currency";

type Result = { status: string; amount: number; method?: string };
export function PaymentResultPage() {
  const [params] = useSearchParams();
  const reference = params.get("reference");
  const [result, setResult] = useState<Result>();
  const [error, setError] = useState("");
  useEffect(() => {
    if (!reference) { setError("Payment reference is missing"); return; }
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout>;
    let cancelled = false;
    async function check() {
      try {
        const { data } = await api.get(`/payments/status/${encodeURIComponent(reference!)}`);
        if (cancelled) return;
        setResult(data);
        if (["READY", "INITIATING", "CHECKOUT"].includes(data.status) && attempts++ < 6) timer = setTimeout(check, 5000);
      } catch (failure) { if (!cancelled) setError(getError(failure)); }
    }
    void check();
    return () => { cancelled = true; clearTimeout(timer); };
  }, [reference]);
  return <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4"><section className="card w-full max-w-lg p-6 sm:p-9"><Link to="/" className="text-sm font-semibold text-navy">Church Pledge Manager</Link><h1 className="mt-8 text-3xl font-bold text-navy">Payment status</h1>{error && <p role="alert" className="mt-5 text-danger">{error}</p>}{result ? <div className="mt-6 space-y-3"><p className="text-2xl font-semibold text-navy">{result.status === "COMPLETED" ? "Payment confirmed" : result.status === "FAILED" ? "Payment not completed" : result.status === "REVERSED" ? "Payment reversed" : "Waiting for payment confirmation"}</p><p>{ugx(result.amount)}</p>{result.method && <p>Paid using {result.method}</p>}<p className="break-all text-xs text-muted">Reference {reference}</p>{result.status === "CHECKOUT" && <p className="text-sm text-muted">We will update this page when Pesapal confirms the payment</p>}</div> : !error && <p className="mt-5">Checking with the church payment records…</p>}</section></main>;
}
