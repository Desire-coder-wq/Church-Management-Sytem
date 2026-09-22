import { useEffect, useState } from "react";
import { api, getError } from "../api/client";
import { ugx } from "../utils/currency";
import { Alert } from "../components/Alert";
export function DashboardPage() {
  const [data, setData] = useState<any>(),
    [error, setError] = useState("");
  useEffect(() => {
    api
      .get("/dashboard")
      .then((r) => setData(r.data))
      .catch((e) => setError(getError(e)));
  }, []);
  if (error) return <Alert message={error} />;
  if (!data) return <p>Loading live dashboard…</p>;
  return (
    <>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-1 text-sm text-muted">
        Live totals from your Neon database.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[
          ["Total members", data.members],
          ["Active campaigns", data.activeCampaigns],
          ["Target", ugx(data.target)],
          ["Pledged", ugx(data.pledged)],
          ["Collected", ugx(data.paid)],
          ["Outstanding", ugx(data.outstanding)],
        ].map(([label, value]) => (
          <div className="card" key={label as string}>
            <p className="text-sm text-muted">{label}</p>
            <p className="mt-3 text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>
    </>
  );
}
