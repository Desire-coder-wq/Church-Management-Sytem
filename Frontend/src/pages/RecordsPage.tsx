import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, X, Download } from "lucide-react";
import { api, getError } from "../api/client";
import { ugx } from "../utils/currency";
import { useAuthStore } from "../stores/auth-store";

type RecordRow = {
  id: string;
  fullName?: string;
  name?: string;
  phone?: string;
  status?: string;
  message?: string;
  amount?: number;
  paid?: number;
  balance?: number;
  targetAmount?: number;
  dueDate?: string;
  paymentDate?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  member?: RecordRow;
  campaign?: RecordRow;
  pledge?: RecordRow;
  pledges?: RecordRow[];
  collections?: RecordRow[];
  group?: { name: string };
  gateway?: string;
  gatewayMethod?: string;
  gatewayConfirmationCode?: string;
  gatewayTrackingId?: string;
  reversedAt?: string | null;
  method?: string;
  referenceNumber?: string;
};
type Field = { key: string; label: string; type?: string; optional?: boolean };
const configs: Record<string, { title: string; singular: string; fields: Field[] }> = {
  members: {
    title: "Members",
    singular: "member",
    fields: [
      { key: "fullName", label: "Full name" },
      { key: "phone", label: "Phone number (+256)" },
      { key: "group", label: "Church group" },
    ],
  },
  campaigns: {
    title: "Campaigns",
    singular: "campaign",
    fields: [
      { key: "name", label: "Campaign name" },
      { key: "description", label: "Description", optional: true },
      { key: "targetAmount", label: "Target amount (UGX)", type: "number" },
      { key: "startDate", label: "Start date", type: "date" },
      { key: "endDate", label: "End date", type: "date" },
    ],
  },
  pledges: {
    title: "Pledges",
    singular: "pledge",
    fields: [
      { key: "memberId", label: "Member", type: "select" },
      { key: "campaignId", label: "Campaign", type: "select" },
      { key: "amount", label: "Pledged amount (UGX)", type: "number" },
      { key: "dueDate", label: "Due date", type: "date" },
    ],
  },
  collections: {
    title: "Collections",
    singular: "collection",
    fields: [
      { key: "pledgeId", label: "Member pledge", type: "select" },
      { key: "amount", label: "Amount received (UGX)", type: "number" },
      { key: "paymentDate", label: "Payment date", type: "date" },
      { key: "method", label: "Payment method", type: "select" },
      { key: "referenceNumber", label: "Reference number", optional: true },
    ],
  },
  notifications: {
    title: "Notifications",
    singular: "notification",
    fields: [],
  },
  reports: { title: "Reports", singular: "report", fields: [] },
};

export function RecordsPage({ resource }: { resource: string }) {
  const config = configs[resource];
  const user = useAuthStore((state) => state.user);
  const [rows, setRows] = useState<RecordRow[]>([]);
  const [members, setMembers] = useState<RecordRow[]>([]);
  const [campaigns, setCampaigns] = useState<RecordRow[]>([]);
  const [pledges, setPledges] = useState<RecordRow[]>([]);
  const [form, setForm] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [requestId, setRequestId] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [memberDetail, setMemberDetail] = useState<RecordRow | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get(`/${resource}`, {
        params: status ? { status } : {},
      });
      setRows(data.rows ?? data);
    } catch (failure) {
      setError(getError(failure));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, [resource, status]);

  async function start(row?: RecordRow) {
    setError("");
    setErrors({});
    setSuccess("");
    setEditId(row?.id ?? null);
    setForm(row ? resource === "campaigns" ? {
      name: row.name ?? "",
      description: row.description ?? "",
      targetAmount: String(row.targetAmount ?? ""),
      startDate: row.startDate?.slice(0, 10) ?? "",
      endDate: row.endDate?.slice(0, 10) ?? "",
      status: row.status ?? "ACTIVE",
    } : {
      fullName: row.fullName ?? "",
      phone: row.phone ?? "",
      group: row.group?.name ?? "",
    } : {});
    setRequestId(crypto.randomUUID());
    setOpen(true);
    try {
      if (resource === "pledges") {
        const [m, c] = await Promise.all([api.get("/members"), api.get("/campaigns")]);
        setMembers(m.data);
        setCampaigns(c.data.filter((item: RecordRow) => item.status === "ACTIVE"));
      }
      if (resource === "collections")
        setPledges((await api.get("/pledges")).data.filter((item: RecordRow) => Number(item.balance) > 0));
    } catch (failure) {
      setError(getError(failure));
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const next: Record<string, string> = {};
    for (const field of config.fields) {
      const value = form[field.key]?.trim() ?? "";
      if (!field.optional && !value) next[field.key] = `${field.label} is required.`;
      else if (
        field.type === "number" &&
        (!Number.isFinite(Number(value)) || Number(value) <= 0 || !/^\d+(\.\d{1,2})?$/.test(value))
      )
        next[field.key] = "Enter an amount greater than zero with at most 2 decimal places.";
      else if (field.key === "phone" && !/^\+256\d{9}$/.test(value))
        next.phone = "Enter +256 followed by 9 digits.";
      else if (["fullName", "group", "name"].includes(field.key) && value.length < 2)
        next[field.key] = "Enter at least 2 characters.";
    }
    if (form.endDate && form.startDate && form.endDate <= form.startDate)
      next.endDate = "End date must be after start date.";
    if (form.paymentDate && form.paymentDate > new Date().toISOString().slice(0, 10))
      next.paymentDate = "Payment date cannot be in the future.";
    const selected = pledges.find((item) => item.id === form.pledgeId);
    if (selected && Number(form.amount) > Number(selected.balance))
      next.amount = `Amount cannot exceed ${ugx(Number(selected.balance))}.`;
    setErrors(next);
    setError("");
    if (Object.keys(next).length) return;
    const payload: Record<string, string | number> = {};
    config.fields.forEach((field) => {
      if (form[field.key]?.trim())
        payload[field.key] = field.type === "number" ? Number(form[field.key]) : form[field.key].trim();
    });
    if (resource === "collections") payload.idempotencyKey = requestId;
    setBusy(true);
    try {
      if (editId) await api.patch(`/${resource}/${editId}`, payload);
      else {
        const { data: saved } = await api.post(`/${resource}`, payload);
        try {
          if (resource === "pledges") {
            await api.post("/notifications/send/pledge-created", {
              memberId: saved.member.id,
              campaignName: saved.campaign.name,
              amount: saved.amount,
              dueDate: saved.dueDate,
            });
          }
          if (resource === "collections" && selected) {
            const balance = Number(selected.balance) - Number(payload.amount);
            await api.post(balance <= 0 ? "/notifications/send/fully-paid" : "/notifications/send/payment-received", {
              memberId: selected.member?.id,
              campaignName: selected.campaign?.name,
              ...(balance > 0 ? { amount: Number(payload.amount), balance } : {}),
            });
          }
        } catch (notificationFailure) {
          setError(`The record was saved, but the SMS could not be sent. ${getError(notificationFailure)}`);
        }
      }
      setOpen(false);
      setSuccess(`${config.singular[0].toUpperCase() + config.singular.slice(1)} saved successfully.`);
      await load();
    } catch (failure) {
      setError(getError(failure));
    } finally {
      setBusy(false);
    }
  }

  async function sendReminder(row: RecordRow) {
    setError("");
    setSuccess("");
    try {
      await api.post("/notifications/send/payment-reminder", {
        memberId: row.member?.id,
        campaignName: row.campaign?.name,
        balance: Number(row.balance),
        dueDate: row.dueDate,
      });
      setSuccess(`Payment reminder sent to ${row.member?.fullName}.`);
    } catch (failure) {
      setError(getError(failure));
    }
  }

  async function retryFailed() {
    setBusy(true);
    setError("");
    try {
      await api.post("/notifications/retry-failed");
      setSuccess("Failed notifications were queued for retry.");
      await load();
    } catch (failure) {
      setError(getError(failure));
    } finally {
      setBusy(false);
    }
  }

  async function viewMember(id: string) {
    setError("");
    try {
      setMemberDetail((await api.get(`/members/${id}`)).data);
    } catch (failure) {
      setError(getError(failure));
    }
  }

  async function download(extension: string) {
    try {
      const { data } = await api.get(`/reports/export.${extension}`, {
        params: status ? { status } : {},
        responseType: "blob",
      });
      const url = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = `pledge-report.${extension}`;
      link.click();
      URL.revokeObjectURL(url);
      setSuccess("Report downloaded.");
    } catch (failure) {
      setError(getError(failure));
    }
  }

  function options(key: string) {
    if (key === "method")
      return ["CASH", "MOBILE_MONEY", "BANK_TRANSFER", "OTHER"].map((value) => ({
        value,
        label: value.replaceAll("_", " "),
      }));
    const items = key === "memberId" ? members : key === "campaignId" ? campaigns : pledges;
    return items.map((item) => ({
      value: item.id,
      label:
        item.fullName ??
        item.name ??
        `${item.member?.fullName} — ${item.campaign?.name} (${ugx(Number(item.balance))} due)`,
    }));
  }

  const filtered = rows.filter((row) => JSON.stringify(row).toLowerCase().includes(search.toLowerCase()));
  const isReadOnly = resource === "notifications" || resource === "reports";

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted">Church workspace</p>
          <h1 className="text-3xl font-bold">{config.title}</h1>
          <p className="mt-2 text-sm text-muted">
            {resource === "reports"
              ? "Review pledge balances and download your records."
              : resource === "notifications"
              ? "View SMS notification history for your church."
              : resource === "collections"
              ? "Pesapal payments appear here after verification. Record cash or other offline collections separately"
              : `Manage your church’s ${config.title.toLowerCase()} in one place`}
          </p>
        </div>
        {!isReadOnly && config.fields.length > 0 && (
          <button className="btn primary inline-flex items-center gap-2" onClick={() => void start()}>
            <Plus size={17} />
            {resource === "collections" ? "Record offline collection" : `Add ${config.singular}`}
          </button>
        )}
        {resource === "collections" && <Link className="btn primary" to="/payments">Create online payment link</Link>}
        {resource === "reports" && (
          <div className="flex gap-2">
            {["xlsx", "pdf"].map((type) => (
              <button key={type} className="btn border border-line bg-white inline-flex items-center gap-2" onClick={() => void download(type)}>
                <Download size={16} />
                {type === "xlsx" ? "Excel" : "PDF"}
              </button>
            ))}
          </div>
        )}
        {resource === "notifications" && user?.role === "ADMIN" && (
          <button disabled={busy} className="btn border border-line bg-white" onClick={() => void retryFailed()}>
            Retry failed SMS
          </button>
        )}
      </div>
      {success && <p role="status" className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-success">{success}</p>}
      {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-danger">{error}</p>}
      <div className="rounded-xl border border-line bg-white">
        <div className="flex flex-wrap items-center gap-3 border-b border-line p-4">
          <Search size={18} className="text-muted" />
          <input
            aria-label="Search records"
            className="min-w-0 flex-1 outline-none text-sm"
            placeholder={`Search ${config.title.toLowerCase()}…`}
            value={search}
             onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />
          <span className="text-xs text-muted">{filtered.length} records</span>
          {resource === "reports" && (
            <select aria-label="Filter by status" className="field w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All statuses</option>
              {["PENDING", "PARTIALLY_PAID", "PAID", "OVERDUE"].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          )}
          {resource === "notifications" && (
            <select aria-label="Filter by status" className="field w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All statuses</option>
              {["PENDING", "SENT", "FAILED"].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          )}
        </div>
         <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
             <thead className="bg-slate-50 text-xs uppercase tracking-wide text-muted">
               <tr>
                 <th className="p-4">{resource === "members" ? "Member" : "Record"}</th>
                 <th className="p-4">Details</th>
                 <th className="p-4">Amount / balance</th>
                 <th className="p-4">Status</th>
                 <th className="p-4">Action</th>
               </tr>
             </thead>
             <tbody>
               {filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((row) => (
                 <tr key={row.id} className="border-t border-line hover:bg-slate-50/70">
                   <td className="p-4 font-medium">
                     {row.fullName ?? row.name ?? row.member?.fullName ?? row.pledge?.member?.fullName ?? "Notification"}
                   </td>
                   <td className="p-4 text-muted">
                     {row.phone ?? row.campaign?.name ?? row.pledge?.campaign?.name ?? row.message ?? "None"}
                     {row.group && <span className="block text-xs">{row.group.name}</span>}
                     {resource === "collections" && <><span className="block text-xs">{row.gatewayMethod || row.method?.replaceAll("_", " ") || "Method not recorded"}</span>{row.gateway && <span className="block text-xs">Verified by {row.gateway}</span>}</>}
                   </td>
                   <td className="p-4">
                     {row.balance !== undefined ? (
                       <>
                         {ugx(row.balance)}
                         <span className="block text-xs text-muted">
                           Paid {ugx(row.paid ?? 0)} of {ugx(row.amount ?? 0)}
                         </span>
                       </>
                     ) : row.amount !== undefined || row.targetAmount !== undefined ? (
                       ugx(Number(row.amount ?? row.targetAmount))
                     ) : (
                       "—"
                     )}
                   </td>
                   <td className="p-4">
                     <span
                       className={`rounded-full px-2 py-1 text-xs font-medium ${row.status === "PAID" || row.status === "SENT" ? "bg-green-50 text-success" : row.status === "OVERDUE" || row.status === "FAILED" ? "bg-red-50 text-danger" : "bg-slate-100 text-muted"}`}
                     >
                       {row.reversedAt ? "Reversed" : row.status?.replaceAll("_", " ") ?? "Active"}
                     </span>
                   </td>
                   <td className="p-4">
                     {resource === "members" && (
                       <div className="flex gap-3">
                         <button className="font-medium text-navy" onClick={() => void viewMember(row.id)}>View</button>
                         {user?.role === "ADMIN" && <button className="font-medium text-navy" onClick={() => void start(row)}>Edit</button>}
                       </div>
                     )}
                     {resource === "campaigns" && user?.role === "ADMIN" && (
                       <button className="font-medium text-navy" onClick={() => void start(row)}>Edit</button>
                     )}
                     {resource === "pledges" && row.balance !== undefined && row.balance > 0 && user?.role === "ADMIN" && (
                       <div className="flex flex-wrap gap-3"><button className="font-medium text-navy" onClick={() => void sendReminder(row)}>Send reminder</button><Link className="font-medium text-navy" to={`/payments?pledge=${encodeURIComponent(row.id)}`}>Payment link</Link></div>
                     )}
                     {resource === "collections" && <span className="block max-w-52 break-all text-xs text-muted">{row.gatewayConfirmationCode || row.referenceNumber || "No reference"}</span>}
                     {resource === "notifications" && <span className="text-xs text-muted">{row.status === "FAILED" ? "Ask an administrator to retry" : "View status"}</span>}
                     {resource === "reports" && <span className="text-xs text-muted">Included in export</span>}
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
         </div>
         {loading ? (
           <p className="p-10 text-center text-muted">Loading records…</p>
         ) : (
           !filtered.length && (
             <div className="p-12 text-center">
               <h2 className="font-semibold">No {config.title.toLowerCase()} yet</h2>
               <p className="mt-2 text-sm text-muted">
                 {config.fields.length
                   ? `Add your first ${config.singular} to get started.`
                   : "Your activity will appear here as records are created."}
               </p>
             </div>
           )
         )}
         {filtered.length > itemsPerPage && (
           <div className="flex items-center justify-between border-t border-line px-4 py-3">
             <p className="text-sm text-muted">
               Page {currentPage} of {Math.ceil(filtered.length / itemsPerPage)}
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
                 disabled={currentPage === Math.ceil(filtered.length / itemsPerPage)}
                 onClick={() => setCurrentPage((p) => {
                   const max = Math.ceil(filtered.length / itemsPerPage);
                   return Math.min(max, p + 1);
                 })}
               >
                 Next
               </button>
             </div>
           </div>
         )}
      </div>
      {memberDetail && resource === "members" && (
        <section className="mt-6 rounded-xl border border-line bg-white p-6" aria-label="Member details">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">{memberDetail.fullName}</h2>
              <p className="mt-1 text-sm text-muted">{memberDetail.phone} · {memberDetail.group?.name}</p>
            </div>
            <button aria-label="Close member details" onClick={() => setMemberDetail(null)}><X size={20} /></button>
          </div>
          <div className="mt-5 space-y-3">
            {(memberDetail.pledges ?? []).map((pledge) => {
              const paid = (pledge.collections ?? []).filter((collection) => !collection.reversedAt).reduce((sum, collection) => sum + Number(collection.amount), 0);
              return <div key={pledge.id} className="flex flex-wrap justify-between gap-3 rounded-lg border border-line p-4 text-sm">
                <span className="font-medium">{pledge.campaign?.name}</span>
                <span className="text-muted">Paid {ugx(paid)} of {ugx(Number(pledge.amount))}</span>
              </div>;
            })}
            {!memberDetail.pledges?.length && <p className="text-sm text-muted">This member has no pledges yet.</p>}
          </div>
        </section>
      )}
      {open && !isReadOnly && (
        <div className="mt-6 rounded-xl border border-line bg-white p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              {editId ? "Edit" : "Add"} {config.singular}
            </h2>
            <button aria-label="Close form" onClick={() => setOpen(false)}>
              <X size={20} />
            </button>
          </div>
          <form noValidate onSubmit={submit} className="grid gap-5 sm:grid-cols-2">
            {config.fields.map((field) => (
              <div key={field.key}>
                <label htmlFor={field.key} className="text-sm font-medium">
                  {field.label}
                  {field.optional && <span className="text-muted"> (optional)</span>}
                </label>
                {field.type === "select" ? (
                  <select
                    id={field.key}
                    className="field"
                    value={form[field.key] ?? ""}
                    onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                  >
                    <option value="">Select {field.label.toLowerCase()}</option>
                    {options(field.key).map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={field.key}
                    className={`field ${errors[field.key] ? "border-red-500" : ""}`}
                    type={field.type ?? "text"}
                    step={field.type === "number" ? "0.01" : undefined}
                    value={form[field.key] ?? ""}
                    aria-invalid={!!errors[field.key]}
                    onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                  />
                )}
                {errors[field.key] && <p className="mt-1 text-xs text-danger">{errors[field.key]}</p>}
              </div>
            ))}
            <div className="flex justify-end gap-3 border-t border-line pt-5 sm:col-span-2">
              <button type="button" className="btn border border-line" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button disabled={busy} className="btn primary">
                {busy ? "Saving…" : `Save ${config.singular}`}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
