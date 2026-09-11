"use client";
import { BarChart3, CircleHelp, FileText, Home, Layers3, LogOut, MapPinned, Shield, UserCog, Users, X } from "lucide-react";
import { useAuth } from "../../lib/AuthContext";

export type NavLabel = "Dashboard" | "Risk Zones" | "Relocation" | "Resources" | "Population" | "Analytics" | "Reports" | "System";

const NAV: [NavLabel, any][] = [
  ["Dashboard", Home],
  ["Risk Zones", MapPinned],
  ["Relocation", Layers3],
  ["Resources", Shield],
  ["Population", Users],
  ["Analytics", BarChart3],
  ["Reports", FileText],
];

/**
 * Shared left-hand navigation.
 *
 * Consolidates the sidebar markup that used to be copy-pasted into
 * every page. Two real bugs came from that duplication and are fixed
 * here, in one place, instead of in seven:
 *  - System.tsx never marked any nav item (including "System" itself)
 *    as active, so the sidebar looked unselected on that screen.
 *  - The "System settings" entry used a different icon (Shield) than
 *    System.tsx itself used for the same destination (UserCog).
 *
 * `badges` lets a page show a live count next to its own nav item
 * (e.g. zone count, report count) without re-declaring the whole list.
 */
export default function AppSidebar({
  active,
  onNavigate,
  mobileOpen,
  onCloseMobileNav,
  badges = {},
}: {
  active: NavLabel;
  onNavigate: (view: string) => void;
  mobileOpen: boolean;
  onCloseMobileNav: () => void;
  badges?: Partial<Record<NavLabel, number | string>>;
}) {
  const { logout } = useAuth();
  const go = (label: string) => { onCloseMobileNav(); onNavigate(label); };

  return (
    <aside className={`${mobileOpen ? "fixed inset-0 z-50 bg-white w-[280px]" : "hidden"} md:block md:sticky md:top-[68px] md:h-[calc(100vh-68px)] w-[245px] shrink-0 bg-white border-r border-line p-4`}>
      <div className="flex justify-between md:hidden mb-6"><b>Navigation</b><button onClick={onCloseMobileNav} aria-label="Close navigation"><X /></button></div>
      <div className="text-[10px] uppercase tracking-[.18em] text-muted px-3 mb-2">Workspace</div>
      <nav className="space-y-1">
        {NAV.map(([label, Icon]) => {
          const badge = badges[label];
          return (
            <button key={label} onClick={() => go(label)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-left ${active === label ? "bg-forest text-white" : "hover:bg-surface"}`}>
              <Icon size={17} />{label}
              {badge !== undefined && (
                <span className={`ml-auto text-[10px] px-1.5 rounded ${active === label ? "bg-white/20" : "bg-danger/10 text-danger"}`}>{badge}</span>
              )}
            </button>
          );
        })}
      </nav>
      <div className="mt-8 border-t border-line pt-5">
        <div className="text-[10px] uppercase tracking-[.18em] text-muted px-3 mb-2">System</div>
        <button onClick={() => go("System")} className={`w-full flex gap-3 px-3 py-2.5 rounded-xl text-sm text-left ${active === "System" ? "bg-forest text-white" : "hover:bg-surface"}`}><UserCog size={17} />System settings</button>
        <button className="w-full flex gap-3 px-3 py-2.5 rounded-xl text-sm hover:bg-surface"><CircleHelp size={17} />Help & methodology</button>
        <button onClick={logout} className="w-full flex gap-3 px-3 py-2.5 rounded-xl text-sm hover:bg-surface"><LogOut size={17} />Sign out</button>
      </div>
      <div className="mt-8 p-3 rounded-2xl bg-forest/5 border border-forest/10">
        <div className="text-xs font-semibold">Scoring model v1.0</div>
        <div className="text-[11px] text-muted mt-1 leading-4">Hazard 45% • exposure 30% • urgency 25%</div>
      </div>
    </aside>
  );
}
