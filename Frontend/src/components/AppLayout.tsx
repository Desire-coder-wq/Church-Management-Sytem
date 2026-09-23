import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Flag,
  HandCoins,
  ReceiptText,
  Bell,
  FileBarChart,
  LogOut,
  CreditCard,
  Menu,
  X,
} from "lucide-react";
import { useAuthStore } from "../stores/auth-store";
const links = [
  ["Dashboard", "/dashboard", LayoutDashboard],
  ["Members", "/members", Users],
  ["Campaigns", "/campaigns", Flag],
  ["Pledges", "/pledges", HandCoins],
  ["Collections", "/collections", ReceiptText],
  ["Payments", "/payments", CreditCard],
  ["Notifications", "/notifications", Bell],
  ["Reports", "/reports", FileBarChart],
] as const;
export function AppLayout({ children }: { children: React.ReactNode }) {
  const logout = useAuthStore((s) => s.logout);
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="min-h-screen md:flex">
      <aside className="bg-navy p-4 text-white md:min-h-screen md:w-64 md:p-5">
        <div className="flex items-center justify-between"><b>Church Pledge</b><button className="rounded-lg p-2 md:hidden" aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={22} /> : <Menu size={22} />}</button></div>
        <nav className={`${menuOpen ? "grid" : "hidden"} mt-5 gap-1 md:mt-8 md:grid md:space-y-1`}>
          {links.map(([name, path, Icon]) => (
            <NavLink key={path} to={path} className="nav" onClick={() => setMenuOpen(false)}>
              <Icon size={17} />
              {name}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="min-w-0 flex-1">
        <header className="flex justify-end border-b border-line bg-white p-4">
          <button
            className="flex items-center gap-2 text-sm text-navy"
            onClick={logout}
          >
            <LogOut size={16} />
            Sign out
          </button>
        </header>
        <section className="p-4 sm:p-5 md:p-8">{children}</section>
      </main>
    </div>
  );
}
