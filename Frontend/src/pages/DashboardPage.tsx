import { useEffect, useState } from "react";
import { api, getError } from "../api/client";
import { ugx } from "../utils/currency";
import { Alert } from "../components/Alert";

export function DashboardPage() {
  const [data, setData] = useState<any>();
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/dashboard")
      .then((r) => setData(r.data))
      .catch((e) => setError(getError(e)));
  }, []);

  if (error) return <Alert message={error} />;
  if (!data) return <p className="text-muted">Loading live dashboard…</p>;

  const stats = [
    ["Total members", data.members],
    ["Active campaigns", data.activeCampaigns],
    ["Target", ugx(data.target)],
    ["Pledged", ugx(data.pledged)],
    ["Collected", ugx(data.paid)],
    ["Outstanding", ugx(data.outstanding)],
  ];

  const statusColor = (status: string) => {
    if (status === "PAID") return "text-success";
    if (status === "PARTIALLY_PAID") return "text-warning";
    if (status === "OVERDUE") return "text-danger";
    return "text-muted";
  };

  return (
    <>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-muted">Live totals from your church workspace.</p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map(([label, value]) => (
          <div key={label as string} className="rounded-xl border border-line bg-white p-5">
            <p className="text-sm text-muted">{label}</p>
            <p className="mt-3 text-2xl font-bold text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      <div className="mb-8 overflow-x-auto rounded-xl border border-line bg-white">
        <div className="border-b border-line p-4">
          <h2 className="font-semibold text-slate-900">Recent collections</h2>
        </div>
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="p-4">Member</th>
              <th className="p-4">Campaign</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Method</th>
              <th className="p-4">Date</th>
            </tr>
          </thead>
          <tbody>
            {data.recentCollections?.length ? (
              data.recentCollections.map((c: any) => (
                <tr key={c.id} className="border-t border-line">
                  <td className="p-4 font-medium">{c.member?.fullName ?? "—"}</td>
                  <td className="p-4 text-muted">{c.campaign?.name ?? "—"}</td>
                  <td className="p-4">{ugx(Number(c.amount))}</td>
                  <td className="p-4 text-muted">{c.method?.replaceAll("_", " ")}</td>
                  <td className="p-4 text-muted">{new Date(c.paymentDate).toLocaleDateString()}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted">
                  No recent collections
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-line bg-white p-5">
          <h2 className="mb-3 font-semibold text-slate-900">Upcoming pledges</h2>
          {data.upcoming?.length ? (
            <div className="space-y-3">
              {data.upcoming.map((p: any) => (
                <div key={p.id} className="border-b border-line pb-2 last:border-0">
                  <p className="font-medium">{p.member?.fullName ?? "Unknown member"}</p>
                  <p className="text-sm text-muted">{p.campaign?.name}</p>
                  <p className="text-sm">
                    <span className="text-muted">Balance:</span> {ugx(p.balance)}
                    <span className="text-muted"> | Due:</span> {new Date(p.dueDate).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">No upcoming pledges</p>
          )}
        </div>

        <div className="rounded-xl border border-line bg-white p-5">
          <h2 className="mb-3 font-semibold text-slate-900">Overdue pledges</h2>
          {data.overdue?.length ? (
            <div className="space-y-3">
              {data.overdue.map((p: any) => (
                <div key={p.id} className="border-b border-line pb-2 last:border-0">
                  <p className="font-medium">{p.member?.fullName ?? "Unknown member"}</p>
                  <p className="text-sm text-muted">{p.campaign?.name}</p>
                  <p className="text-sm">
                    <span className="text-muted">Balance:</span>{" "}
                    <span className={statusColor(p.status)}>{ugx(p.balance)}</span>
                    <span className="text-muted"> | Due:</span> {new Date(p.dueDate).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">No overdue pledges</p>
          )}
        </div>
      </div>
    </>
  );
}