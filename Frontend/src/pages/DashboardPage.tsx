import { useEffect, useState } from "react";
import { api, getError } from "../api/client";
import { ugx } from "../utils/currency";
import { Alert } from "../components/Alert";

type Stat = {
  label: string;
  value: string | number;
  icon?: string;
};

export function DashboardPage() {
  const [data, setData] = useState<any>();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setLoading(true);
    api
      .get("/dashboard")
      .then((r) => {
        setData(r.data);
        setLoading(false);
      })
      .catch((e) => {
        setError(getError(e));
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-navy border-t-transparent"></div>
      </div>
    );
  }

  if (error) return <Alert message={error} />;

  if (!data) return <p className="text-muted">Loading live dashboard…</p>;

  const stats: Stat[] = [
    { label: "Total Members", value: data.members, icon: "👥" },
    { label: "Active Campaigns", value: data.activeCampaigns, icon: "🏁" },
    { label: "Target", value: ugx(data.target), icon: "🎯" },
    { label: "Pledged", value: ugx(data.pledged), icon: "🤝" },
    { label: "Collected", value: ugx(data.paid), icon: "💰" },
    { label: "Outstanding", value: ugx(data.outstanding), icon: "⏳" },
  ];

  const statusColor = (status: string) => {
    if (status === "PAID") return "text-green-600";
    if (status === "PARTIALLY_PAID") return "text-amber-600";
    if (status === "OVERDUE") return "text-red-600";
    return "text-slate-500";
  };

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Live totals from your church workspace.</p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((stat, i) => (
          <div key={i} className="stat-card">
            <p className="stat-label">{stat.label}</p>
            <p className="stat-value">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mb-8 table-container">
        <div className="border-b border-line p-4">
          <h2 className="section-title">Recent Collections</h2>
        </div>
        <table className="table">
          <thead className="table-header">
            <tr>
              <th className="table-cell">Member</th>
              <th className="table-cell">Campaign</th>
              <th className="table-cell">Amount</th>
              <th className="table-cell">Method</th>
              <th className="table-cell">Date</th>
            </tr>
          </thead>
         <tbody>
             {data.recentCollections?.length ? (
               data.recentCollections.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((c: any) => (
                 <tr key={c.id} className="table-row">
                  <td className="table-cell font-medium">{c.member?.fullName ?? "—"}</td>
                  <td className="table-cell text-muted">{c.campaign?.name ?? "—"}</td>
                  <td className="table-cell">{ugx(Number(c.amount))}</td>
                  <td className="table-cell text-muted">{c.method?.replaceAll("_", " ")}</td>
                  <td className="table-cell text-muted">{new Date(c.paymentDate).toLocaleDateString()}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="table-cell text-center text-muted py-8">
                  No recent collections
                </td>
              </tr>
            )}
           </tbody>
         </table>
       </div>
       {data.recentCollections?.length > itemsPerPage && (
         <div className="flex items-center justify-between border-t border-line px-4 py-3">
           <p className="text-sm text-muted">
             Page {currentPage} of {Math.ceil((data.recentCollections?.length || 0) / itemsPerPage)}
           </p>
           <div className="flex gap-1">
             <button
               className="rounded-md px-3 py-1 text-sm font-medium text-navy hover:bg-slate-100 disabled:opacity-50"
               disabled={currentPage === 1}
               onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
             >
               Previous
             </button>
             <button
               className="rounded-md px-3 py-1 text-sm font-medium text-navy hover:bg-slate-100 disabled:opacity-50"
               disabled={currentPage === Math.ceil((data.recentCollections?.length || 0) / itemsPerPage)}
               onClick={() => setCurrentPage((p) => {
                 const max = Math.ceil((data.recentCollections?.length || 0) / itemsPerPage);
                 return Math.min(max, p + 1);
               })}
             >
               Next
             </button>
           </div>
         </div>
       )}

      <div className="mb-8 grid gap-4 lg:grid-cols-2">
        <div className="stat-card">
          <h2 className="section-title">Upcoming Pledges</h2>
          {data.upcoming?.length ? (
            <div className="space-y-3">
              {data.upcoming.map((p: any) => (
                <div key={p.id} className="border-b border-line pb-2 last:border-0">
                  <p className="font-medium">{p.member?.fullName ?? "Unknown member"}</p>
                  <p className="text-sm text-muted">{p.campaign?.name}</p>
                  <p className="text-sm">
                    <span className="text-muted">Balance:</span> {ugx(p.balance)}
                    <span className="text-muted ml-2">| Due:</span>{" "}
                    {new Date(p.dueDate).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">No upcoming pledges</p>
          )}
        </div>

        <div className="stat-card">
          <h2 className="section-title">Overdue Pledges</h2>
          {data.overdue?.length ? (
            <div className="space-y-3">
              {data.overdue.map((p: any) => (
                <div key={p.id} className="border-b border-line pb-2 last:border-0">
                  <p className="font-medium">{p.member?.fullName ?? "Unknown member"}</p>
                  <p className="text-sm text-muted">{p.campaign?.name}</p>
                  <p className="text-sm">
                    <span className="text-muted">Balance:</span>{" "}
                    <span className={statusColor(p.status)}>{ugx(p.balance)}</span>
                    <span className="text-muted ml-2">| Due:</span>{" "}
                    {new Date(p.dueDate).toLocaleDateString()}
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