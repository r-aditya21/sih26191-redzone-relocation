"use client";
import { Bell, ChevronDown, Menu, Shield } from "lucide-react";
import { useAuth } from "../../lib/AuthContext";

/**
 * Shared top bar used on every screen.
 *
 * Previously each page (Analytics, Population, Relocation, Reports,
 * Resources, Risk Zones, System) hard-coded the profile block as the
 * initials "DM" / the label "District Officer" / "SDMA Control Room".
 * Dashboard.tsx was the only screen that actually read the signed-in
 * user from useAuth(). That meant the name in the header only matched
 * the logged-in user on the Dashboard, and reverted to the fake
 * "District Officer" placeholder everywhere else.
 *
 * Centralizing the header here means there is exactly one place that
 * reads the session, so the fix (and any future change to the profile
 * block) applies to every screen automatically.
 */
export default function AppHeader({ onOpenMobileNav }: { onOpenMobileNav: () => void }) {
  const { user, logout } = useAuth();
  const initials = (user?.name || "?").trim().split(/\s+/).map(p => p[0]).slice(0, 2).join("").toUpperCase();

  return (
    <header className="h-[68px] bg-white border-b border-line flex items-center px-4 md:px-7 sticky top-0 z-30">
      <button className="md:hidden mr-3" onClick={onOpenMobileNav} aria-label="Open navigation">
        <Menu size={22} />
      </button>
      <div className="flex items-center gap-3 min-w-[245px]">
        <div className="w-10 h-10 rounded-xl bg-forest text-white grid place-items-center"><Shield size={21} /></div>
        <div>
          <b>RakshaGrid</b>
          <div className="text-[10px] uppercase tracking-[.16em] text-muted">Proactive relocation command</div>
        </div>
      </div>
      <div className="hidden lg:flex flex-1 justify-center">
        <div className="text-xs text-muted px-4 py-2 rounded-full bg-surface border border-line">
          <span className="inline-block w-2 h-2 rounded-full bg-safe mr-2" />Case study: Uttarakhand • Demo dataset
        </div>
      </div>
      <div className="ml-auto flex items-center gap-3">
        <Bell size={19} />
        <div className="hidden sm:flex items-center gap-3 border-l border-line pl-4">
          <div className="w-9 h-9 rounded-full bg-forest/10 text-forest grid place-items-center text-sm font-bold">{initials}</div>
          <div className="text-xs">
            <b>{user?.name || "..."}</b>
            <div className="text-muted capitalize">{user?.role || ""}</div>
          </div>
          {logout
            ? <button onClick={logout} className="text-xs text-muted hover:text-danger ml-2">Sign out</button>
            : <ChevronDown size={15} />}
        </div>
      </div>
    </header>
  );
}
