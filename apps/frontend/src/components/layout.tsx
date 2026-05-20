import { Link, NavLink } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useState, type PropsWithChildren } from "react";

const links = [
  { to: "/", label: "Swipe" },
  { to: "/watchlist", label: "Watchlist" },
  { to: "/recommendations", label: "Recommendations" },
  { to: "/voice-actors", label: "Voice Actors" },
];

export const Layout = ({ children }: PropsWithChildren) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-10 pt-4 sm:px-8">
      <header className="mb-6 flex flex-wrap items-center justify-between rounded-2xl border border-border bg-card/70 px-4 py-3 backdrop-blur">
        <Link to="/" className="text-lg font-bold tracking-wide text-primary">
          AniSwipe
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `rounded-xl px-3 py-1.5 text-sm transition ${
                  isActive ? "bg-primary text-white" : "text-foreground hover:bg-muted"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-muted/40 text-foreground transition hover:bg-muted md:hidden"
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMobileMenuOpen((open) => !open)}
        >
          {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>

        {mobileMenuOpen ? (
          <nav className="mt-3 flex w-full flex-col gap-2 md:hidden">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `rounded-xl px-3 py-2 text-sm transition ${
                    isActive ? "bg-primary text-white" : "text-foreground hover:bg-muted"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        ) : null}
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
};
