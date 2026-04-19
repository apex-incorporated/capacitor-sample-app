import { NavLink, Outlet } from "react-router-dom";
import { Home as HomeIcon, ShoppingBag, Settings as SettingsIcon } from "lucide-react";
import type { ComponentType } from "react";

interface TabDef {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

const TABS: TabDef[] = [
  { to: "/", label: "Home", icon: HomeIcon },
  { to: "/products", label: "Products", icon: ShoppingBag },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

/**
 * Basic shell with a header + bottom tab bar. Uses the bottom-tab
 * pattern most mobile apps use so the sample resembles a real Capacitor
 * app rather than a web page.
 */
export function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-apex-paper">
      <Header />
      <main className="flex-1 px-4 pb-24 pt-4">
        <Outlet />
      </main>
      <TabBar />
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-black/5 bg-white/90 px-4 py-3 backdrop-blur">
      <div className="flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-lg bg-apex-amber text-[11px] font-black text-apex-ink">
          A
        </div>
        <div>
          <div className="text-sm font-semibold">Apex Sample</div>
          <div className="text-[10px] text-apex-muted">
            capacitor-plugin v0.1 demo
          </div>
        </div>
      </div>
      <a
        href="https://github.com/apex-incorporated/capacitor-sample-app"
        target="_blank"
        rel="noreferrer"
        className="text-[11px] text-apex-muted hover:text-apex-ink"
      >
        Source ↗
      </a>
    </header>
  );
}

function TabBar() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-10 border-t border-black/10 bg-white/95 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <ul className="mx-auto flex max-w-md items-stretch">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <li key={t.to} className="flex-1">
              <NavLink
                to={t.to}
                end={t.to === "/"}
                className={({ isActive }) =>
                  [
                    "flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
                    isActive
                      ? "text-apex-ink"
                      : "text-apex-muted hover:text-apex-ink",
                  ].join(" ")
                }
              >
                <Icon className="size-5" />
                {t.label}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
