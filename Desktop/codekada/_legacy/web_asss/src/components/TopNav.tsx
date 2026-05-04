import { Link, useLocation } from "react-router-dom";

const navItems = [
  { label: "Patient", to: "/patient" },
  { label: "Admin", to: "/admin" },
];

const TopNav = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <header className="relative z-10">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent text-sm font-semibold text-white shadow-soft">
            TP
          </div>
          <div>
            <p className="text-[0.65rem] uppercase tracking-[0.32em] text-muted">
              TriagePH
            </p>
            <p className="text-lg font-display">Health Intelligence</p>
          </div>
        </div>
        <nav className="flex items-center gap-2 rounded-full border border-stroke bg-white/70 p-2 shadow-soft backdrop-blur">
          {navItems.map((item) => {
            const active = isActive(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  active
                    ? "bg-accent text-white"
                    : "text-muted hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

export default TopNav;
