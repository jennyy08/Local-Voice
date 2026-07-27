import { MapPin, BookOpen } from "lucide-react";

type HeroProps = {
  scrollTo: (id: string) => void;
};

export default function Hero({ scrollTo }: HeroProps) {
    return (
      <section id="home" className="pt-14 min-h-screen grid md:grid-cols-[1fr_1fr]">
        {/* Left — deep navy panel */}
        <div className="bg-primary flex flex-col justify-center px-8 sm:px-12 lg:px-16 py-24 md:py-0">
          <div className="max-w-md">
            <span className="font-mono text-xs text-accent/80 tracking-[0.22em] uppercase mb-6 block">
              Ottawa · Ontario · 2026
            </span>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-[4.5rem] text-primary-foreground leading-[1.03] mb-8 tracking-tight">
              Your city.<br />
              <em className="text-accent">Your voice.</em>
            </h1>
            <p className="text-primary-foreground/60 text-base sm:text-lg leading-relaxed mb-10 font-sans">
              Report local issues, track city responses, and understand how municipal government works — built for Ottawa residents.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => scrollTo("map")}
                className="bg-accent text-primary font-semibold px-6 py-3.5 rounded-sm flex items-center justify-center gap-2 hover:bg-accent/90 transition-all duration-200 hover:-translate-y-0.5 text-sm"
              >
                <MapPin size={15} />
                Report an Issue
              </button>
              <button
                type="button"
                onClick={() => scrollTo("learn")}
                className="border border-white/20 text-primary-foreground px-6 py-3.5 rounded-sm flex items-center justify-center gap-2 hover:bg-white/8 transition-all duration-200 hover:-translate-y-0.5 text-sm"
              >
                <BookOpen size={15} />
                Civic Literacy
              </button>
            </div>

            <div className="mt-16 grid grid-cols-3 gap-6 border-t border-white/10 pt-10">
              {[
                { n: "30+", label: "Pilot Users" },
                { n: "6", label: "Issues Filed" },
                { n: "2", label: "Resolved" },
              ].map((s) => (
                <div key={s.label}>
                  <div className="font-display text-3xl text-accent">{s.n}</div>
                  <div className="font-mono text-[10px] text-primary-foreground/40 mt-1 tracking-widest uppercase">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right — photo panel */}
        <div className="relative hidden md:block bg-slate-700 overflow-hidden min-h-[500px]">
          <img
            src="https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=900&h=900&fit=crop&auto=format"
            alt="Aerial view of urban neighbourhood streets"
            className="w-full h-full object-cover opacity-75"
          />
          <div className="absolute inset-0 bg-gradient-to-bl from-primary/20 via-transparent to-primary/70" />

          {/* Floating preview card */}
          <div className="absolute bottom-10 left-8 bg-card rounded-sm p-4 shadow-2xl w-72 border border-border">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500 mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-card-foreground leading-tight">
                  Pothole on Elgin St near Gladstone
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Roads · In Review · 12 upvotes</p>
              </div>
            </div>
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 w-[62%] rounded-full" />
            </div>
            <p className="text-[11px] font-mono text-muted-foreground mt-2">
              City response in progress
            </p>
          </div>

          {/* Grant badge */}
          <a
            href="https://glocalfoundation.ca"
            target="_blank"
            rel="noreferrer"
            className="absolute top-6 right-6 bg-primary/80 backdrop-blur-sm border border-white/15 rounded-sm px-3 py-2 hover:bg-primary/90 transition-colors"
          >
            <p className="text-[10px] font-mono text-accent tracking-widest uppercase">CANConnect</p>
            <p className="text-[10px] font-mono text-primary-foreground/50 mt-0.5">GLOCAL Foundation</p>
          </a>
        </div>
      </section>
    )
}