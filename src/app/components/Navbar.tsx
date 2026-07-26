import { type Dispatch, type SetStateAction } from "react";
import { MapPin, Moon, Sun, Menu, X } from "lucide-react";
import { NAV_LINKS } from "../../data/constants";

type NavbarProps = {
  activeSection: string;
  menuOpen: boolean;
  setMenuOpen: Dispatch<SetStateAction<boolean>>;
  darkMode: boolean;
  setDarkMode: Dispatch<SetStateAction<boolean>>;
  scrollTo: (id: string) => void;
};

export default function Navbar({
  activeSection,
  menuOpen,
  setMenuOpen,
  darkMode,
  setDarkMode,
  scrollTo,
}: NavbarProps) {
  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-primary/95 backdrop-blur-sm border-b border-white/10">
      <div className="w-full px-4 sm:px-6 flex items-center justify-between h-14">
        <button onClick={() => scrollTo("home")} className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 bg-accent rounded-sm flex items-center justify-center">
            <MapPin size={13} className="text-primary" />
          </div>
          <span className="font-display text-lg text-primary-foreground tracking-tight">Local Voice</span>
        </button>

        <div className="hidden md:flex items-center gap-0.5">
          {NAV_LINKS.map((l) => (
            <button
              key={l.id}
              onClick={() => scrollTo(l.id)}
              className={`px-4 py-2 text-xs font-mono tracking-widest uppercase transition-colors rounded-sm ${
                activeSection === l.id
                  ? "bg-accent/15 text-accent"
                  : "text-primary-foreground/50 hover:text-primary-foreground"
              }`}
            >
              {l.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setDarkMode((prev) => !prev)}
            className="ml-2 rounded-sm border border-white/15 p-2 text-primary-foreground/70 transition-colors hover:text-primary-foreground"
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? <Moon size={16} /> : <Sun size={16} />}
          </button>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={() => setDarkMode((prev) => !prev)}
            className="rounded-sm border border-white/15 p-2 text-primary-foreground/70 transition-colors hover:text-primary-foreground"
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? <Moon size={16} /> : <Sun size={16} />}
          </button>
          <button
            type="button"
            className="text-primary-foreground/70 hover:text-primary-foreground p-1"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle navigation menu"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-primary border-t border-white/10 px-4 py-2 pb-4 space-y-0.5">
          {NAV_LINKS.map((l) => (
            <button
              key={l.id}
              onClick={() => scrollTo(l.id)}
              className="block w-full text-left px-3 py-3 text-xs font-mono tracking-widest uppercase text-primary-foreground/60 hover:text-primary-foreground transition-colors border-b border-white/5 last:border-0"
            >
              {l.label}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
}