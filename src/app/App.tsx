import { useEffect, useState } from "react";
import {
  MapPin, Camera, Phone, BookOpen, Search, Menu, X,
  Mail, CheckCircle, Clock, AlertCircle, ChevronRight,
  Building2, ExternalLink, ThumbsUp, Moon, Sun, Bookmark, BookmarkCheck,
} from "lucide-react";

// ── Data ─────────────────────────────────────────────────────────────────────

const ISSUES = [
  {
    id: 1,
    title: "Pothole on Elgin St near Gladstone",
    category: "Roads",
    status: "In Review",
    date: "Jul 18, 2026",
    votes: 12,
    x: 38,
    y: 44,
    description: "Large pothole ~30cm wide. Caused two flat tires in three days.",
  },
  {
    id: 2,
    title: "Broken streetlight — Bank & Third Ave",
    category: "Lighting",
    status: "Resolved",
    date: "Jul 10, 2026",
    votes: 8,
    x: 63,
    y: 57,
    description: "Streetlight out for six weeks. Corner is unsafe at night.",
  },
  {
    id: 3,
    title: "Overflowing recycling bins at Glebe Community Ctr",
    category: "Waste",
    status: "Pending",
    date: "Jul 21, 2026",
    votes: 5,
    x: 54,
    y: 71,
    description: "Bins not collected since July 14. Material scattered on sidewalk.",
  },
  {
    id: 4,
    title: "Cracked sidewalk — Lyon St between Lisgar & James",
    category: "Roads",
    status: "In Review",
    date: "Jul 19, 2026",
    votes: 19,
    x: 27,
    y: 62,
    description: "Large crack creating trip hazard for strollers and wheelchair users.",
  },
  {
    id: 5,
    title: "Fallen tree branch blocking Chamberlain Ave bike lane",
    category: "Parks",
    status: "Resolved",
    date: "Jul 8, 2026",
    votes: 7,
    x: 74,
    y: 37,
    description: "Storm debris not cleared after last weekend's storm.",
  },
  {
    id: 6,
    title: "Graffiti on utility box — Bronson near Carling",
    category: "Graffiti",
    status: "Pending",
    date: "Jul 22, 2026",
    votes: 3,
    x: 20,
    y: 29,
    description: "New graffiti appeared overnight on city utility box.",
  },
];

const CONTACTS = [
  {
    name: "Coun. Ariel Troster",
    role: "City Councillor, Somerset Ward 14",
    phone: "613-580-2483",
    email: "ariel.troster@ottawa.ca",
  },
  {
    name: "City of Ottawa 311",
    role: "General Service Requests & Non-Emergency Issues",
    phone: "3-1-1",
    email: "client.services@ottawa.ca",
  },
  {
    name: "Roads & Traffic Management",
    role: "Potholes, Road Repair, Traffic Signals",
    phone: "613-580-2400",
    email: "roads@ottawa.ca",
  },
  {
    name: "Waste Management Services",
    role: "Garbage, Recycling & Composting Pickup",
    phone: "613-580-2400",
    email: "recycle@ottawa.ca",
  },
  {
    name: "Ottawa Public Health",
    role: "Environmental Health & Safety Concerns",
    phone: "613-580-6744",
    email: "health@ottawa.ca",
  },
  {
    name: "Ottawa By-law Services",
    role: "Property Standards, Noise, Animals",
    phone: "613-580-2400",
    email: "bylaw@ottawa.ca",
  },
];

const LEARN_SECTIONS = [
  {
    id: "council",
    label: "City Council",
    heading: "Who Makes Decisions at City Hall?",
    body: [
      "Ottawa City Council is made up of the Mayor and 24 City Councillors — one elected per ward. Council meets roughly every three weeks to debate and vote on city policy, budgets, bylaws, and development applications.",
      "Your Councillor is your most direct line to city government. They sit on committees, raise ward issues, and can escalate urgent concerns on your behalf. Unlike federal or provincial politics, your city councillor lives in your neighbourhood.",
    ],
    stat: "24",
    statLabel: "wards in Ottawa, each with an elected Councillor",
  },
  {
    id: "report",
    label: "After You Report",
    heading: "What Happens to Your Report?",
    body: [
      "When you submit a 311 request or file through Local Voice, your report is assigned a service request number and routed to the relevant city department. Roads issues go to Public Works. Parks issues go to Recreation & Parks.",
      "The department reviews, prioritizes, and schedules a response. Straightforward repairs may be resolved within days. Complex issues involving infrastructure or safety may require a site visit and Council approval. Save your reference number to track progress.",
    ],
    stat: "15",
    statLabel: "business days — average first response time for a 311 request",
  },
  {
    id: "budget",
    label: "City Budget",
    heading: "Where Does Your Tax Dollar Go?",
    body: [
      "Ottawa's operating budget is over $5 billion annually. The largest shares fund Ottawa Police Service (~$400M), OC Transpo, Ottawa Community Housing, and infrastructure maintenance across the city's roads, water systems, and buildings.",
      "Capital projects — bridges, recreation centres, road reconstruction — are funded through a separate Capital Budget approved by Council each fall. Residents can participate in ward-level budget consultations, usually held in October and November.",
    ],
    stat: "$5.1B",
    statLabel: "Ottawa's 2026 operating budget — your taxes at work",
  },
  {
    id: "participate",
    label: "Get Involved",
    heading: "Beyond Reporting — Real Participation",
    body: [
      "Residents can engage Ottawa's civic life in many ways: attending public consultations on official plans and bylaws, delegating at a committee meeting, joining a community association, signing a petition, or running for Council.",
      "Public delegations take as little as ten minutes. You register online, appear at City Hall or virtually, and speak directly to Councillors. It is one of the most powerful — and underused — forms of civic participation available to any Ottawa resident.",
    ],
    stat: "10 min",
    statLabel: "typical public delegation at Ottawa City Hall",
  },
];

const CATEGORY_CONFIG: Record<string, { color: string; bg: string }> = {
  Roads: { color: "#DC4E28", bg: "#FEF2EE" },
  Lighting: { color: "#A96200", bg: "#FEF7E8" },
  Waste: { color: "#1A7A4A", bg: "#EBF9F0" },
  Parks: { color: "#1E6E8A", bg: "#EAF4F9" },
  Graffiti: { color: "#6B2D8E", bg: "#F5EDF9" },
  "Snow & Ice": { color: "#1D4ED8", bg: "#EEF3FE" },
};

const STATUS_CONFIG: Record<string, { color: string; bg: string; Icon: typeof CheckCircle }> = {
  Pending: { color: "#92400E", bg: "#FEF3C7", Icon: AlertCircle },
  "In Review": { color: "#1E3A8A", bg: "#DBEAFE", Icon: Clock },
  Resolved: { color: "#14532D", bg: "#DCFCE7", Icon: CheckCircle },
};

const NAV_LINKS = [
  { id: "home", label: "Home" },
  { id: "map", label: "Report" },
  { id: "issues", label: "Issues" },
  { id: "learn", label: "Learn" },
  { id: "directory", label: "Directory" },
];

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const [activeSection, setActiveSection] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedPin, setSelectedPin] = useState<number | null>(null);
  const [filterCategory, setFilterCategory] = useState("All");
  const [learnTab, setLearnTab] = useState("council");
  const [contactSearch, setContactSearch] = useState("");
  const [reportForm, setReportForm] = useState({
    title: "",
    category: "Roads",
    description: "",
    location: "",
  });
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [votes, setVotes] = useState<Record<number, boolean>>({});
  const [darkMode, setDarkMode] = useState(false);
  const [savedIssueIds, setSavedIssueIds] = useState<number[]>([]);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("localvoice-theme");
    const storedDraft = window.localStorage.getItem("localvoice-report-form");
    const storedSaved = window.localStorage.getItem("localvoice-saved-issues");

    if (storedTheme) {
      setDarkMode(storedTheme === "dark");
    } else {
      setDarkMode(window.matchMedia("(prefers-color-scheme: dark)").matches);
    }

    if (storedDraft) {
      try {
        setReportForm(JSON.parse(storedDraft));
      } catch {
        // Ignore invalid saved draft
      }
    }

    if (storedSaved) {
      try {
        setSavedIssueIds(JSON.parse(storedSaved));
      } catch {
        // Ignore invalid saved issues
      }
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    window.localStorage.setItem("localvoice-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    window.localStorage.setItem("localvoice-report-form", JSON.stringify(reportForm));
  }, [reportForm]);

  useEffect(() => {
    window.localStorage.setItem("localvoice-saved-issues", JSON.stringify(savedIssueIds));
  }, [savedIssueIds]);

  const scrollTo = (id: string) => {
    setActiveSection(id);
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const handleVote = (id: number) =>
    setVotes((prev) => ({ ...prev, [id]: !prev[id] }));

  const toggleSavedIssue = (id: number) => {
    setSavedIssueIds((prev) =>
      prev.includes(id) ? prev.filter((savedId) => savedId !== id) : [...prev, id]
    );
  };

  const handleReport = (e: React.FormEvent) => {
    e.preventDefault();
    setReportSubmitted(true);
    setTimeout(() => setReportSubmitted(false), 4000);
    setReportForm({ title: "", category: "Roads", description: "", location: "" });
  };

  const visibleIssues =
    filterCategory === "All" ? ISSUES : ISSUES.filter((i) => i.category === filterCategory);

  const savedIssues = ISSUES.filter((issue) => savedIssueIds.includes(issue.id));

  const visibleContacts = CONTACTS.filter(
    (c) =>
      c.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
      c.role.toLowerCase().includes(contactSearch.toLowerCase())
  );

  const activeLearn = LEARN_SECTIONS.find((s) => s.id === learnTab)!;

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">

      {/* ── Nav ────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-primary/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
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

      {/* ── Hero ───────────────────────────────────────────────────── */}
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
          <div className="absolute top-6 right-6 bg-primary/80 backdrop-blur-sm border border-white/15 rounded-sm px-3 py-2">
            <p className="text-[10px] font-mono text-accent tracking-widest uppercase">CANConnect</p>
            <p className="text-[10px] font-mono text-primary-foreground/50 mt-0.5">GLOCAL Foundation</p>
          </div>
        </div>
      </section>

      {/* ── Map + Report ───────────────────────────────────────────── */}
      <section id="map" className="bg-secondary py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10">
            <span className="font-mono text-[10px] text-accent tracking-[0.22em] uppercase">Interactive Map</span>
            <h2 className="font-display text-4xl sm:text-5xl text-foreground mt-2 tracking-tight">
              Report an Issue
            </h2>
            <p className="text-muted-foreground mt-3 max-w-lg text-sm leading-relaxed">
              Select a pin to see an existing report, or fill out the form to submit a new one. All reports are forwarded to Ottawa 311.
            </p>
          </div>

          <div className="grid lg:grid-cols-5 gap-6 items-start">
            {/* Map */}
            <div
              className="lg:col-span-3 relative rounded-sm overflow-hidden shadow-lg bg-[#E8E2D8]"
              style={{ height: 460 }}
            >
              {/* SVG street grid */}
              <svg
                className="absolute inset-0 w-full h-full"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="none"
              >
                <rect width="100%" height="100%" fill="#E8E2D8" />

                {/* City blocks */}
                {[8, 22, 36, 50, 64, 78].flatMap((x) =>
                  [8, 22, 36, 50, 64, 78].map((y) => (
                    <rect
                      key={`block-${x}-${y}`}
                      x={`${x}%`} y={`${y}%`}
                      width="11%" height="11%"
                      fill="#D8D0BF" rx="2"
                    />
                  ))
                )}

                {/* Horizontal streets */}
                {[20, 34, 48, 62, 76].map((y) => (
                  <line
                    key={`h-${y}`}
                    x1="0" y1={`${y}%`} x2="100%" y2={`${y}%`}
                    stroke="#C8BEA8" strokeWidth="7"
                  />
                ))}
                {/* Vertical streets */}
                {[20, 34, 48, 62, 76].map((x) => (
                  <line
                    key={`v-${x}`}
                    x1={`${x}%`} y1="0" x2={`${x}%`} y2="100%"
                    stroke="#C8BEA8" strokeWidth="7"
                  />
                ))}

                {/* Green space */}
                <rect x="64%" y="22%" width="13%" height="13%" fill="#B4CCA4" rx="3" />
                <text x="70.5%" y="29.5%" textAnchor="middle" fontSize="7" fill="#5A7A46" fontFamily="monospace" fontWeight="500">PARK</text>

                {/* Water feature */}
                <rect x="0" y="60%" width="14%" height="40%" fill="#AACCDD" opacity="0.6" />
                <text x="7%" y="75%" textAnchor="middle" fontSize="6" fill="#3A6A80" fontFamily="monospace">CANAL</text>

                {/* Street labels */}
                <text x="34%" y="18.5%" textAnchor="middle" fontSize="6.5" fill="#9A8A74" fontFamily="monospace" fontWeight="500">ELGIN ST</text>
                <text x="62%" y="18.5%" textAnchor="middle" fontSize="6.5" fill="#9A8A74" fontFamily="monospace" fontWeight="500">BANK ST</text>
                <text x="14%" y="34%" textAnchor="middle" fontSize="6" fill="#9A8A74" fontFamily="monospace" transform="rotate(-90, 100, 150)">LYON ST</text>
                <text x="75%" y="18.5%" textAnchor="middle" fontSize="6.5" fill="#9A8A74" fontFamily="monospace" fontWeight="500">BRONSON</text>

                {/* You are here */}
                <circle cx="48%" cy="48%" r="6" fill="#0B1F3A" opacity="0.9" />
                <circle cx="48%" cy="48%" r="3" fill="#F2EDE4" />
                <text x="48%" y="43%" textAnchor="middle" fontSize="6" fill="#0B1F3A" fontFamily="monospace" fontWeight="600">YOU</text>
              </svg>

              {/* Issue pins */}
              {visibleIssues.map((issue) => {
                const cfg = CATEGORY_CONFIG[issue.category] || { color: "#555", bg: "#eee" };
                const isSelected = selectedPin === issue.id;
                return (
                  <button
                    key={issue.id}
                    onClick={() => setSelectedPin(isSelected ? null : issue.id)}
                    className="absolute -translate-x-1/2 -translate-y-full transition-transform hover:scale-110 z-10"
                    style={{ left: `${issue.x}%`, top: `${issue.y}%` }}
                    title={issue.title}
                  >
                    <div
                      className={`w-6 h-6 rounded-full border-2 border-white shadow-md flex items-center justify-center transition-all ${
                        isSelected ? "scale-125 shadow-lg" : ""
                      }`}
                      style={{ backgroundColor: cfg.color }}
                    >
                      <MapPin size={10} color="white" />
                    </div>

                    {isSelected && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-card border border-border rounded-sm shadow-2xl p-3 w-52 text-left z-20">
                        <p className="text-xs font-semibold text-card-foreground leading-tight mb-1">
                          {issue.title}
                        </p>
                        <p className="text-[11px] font-mono text-muted-foreground">
                          {issue.category} · {issue.status}
                        </p>
                        <p className="text-[11px] font-mono text-muted-foreground">{issue.date}</p>
                      </div>
                    )}
                  </button>
                );
              })}

              {/* Category filter overlay */}
              <div className="absolute top-3 right-3 flex flex-wrap gap-1 justify-end max-w-[180px]">
                {["All", ...Object.keys(CATEGORY_CONFIG)].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`px-2 py-0.5 rounded-sm text-[10px] font-mono tracking-wide transition-colors shadow-sm ${
                      filterCategory === cat
                        ? "bg-primary text-primary-foreground"
                        : "bg-card/90 text-foreground hover:bg-card"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Legend */}
              <div className="absolute bottom-3 left-3 bg-card/90 rounded-sm p-2.5 border border-border/50 shadow">
                <p className="font-mono text-[9px] text-muted-foreground mb-1.5 tracking-widest uppercase">Map Legend</p>
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-2 h-2 rounded-full bg-[#0B1F3A]" />
                  <span className="font-mono text-[10px] text-foreground">Your location</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[#DC4E28]" />
                  <span className="font-mono text-[10px] text-foreground">Reported issue</span>
                </div>
              </div>
            </div>

            {/* Report form */}
            <div className="lg:col-span-2 bg-card border border-border rounded-sm p-6 shadow-sm">
              <h3 className="font-display text-2xl text-foreground mb-0.5 tracking-tight">Submit a Report</h3>
              <p className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase mb-6">
                Forwarded to Ottawa 311
              </p>
              <p className="mb-5 text-xs text-muted-foreground leading-relaxed">
                Your draft is saved automatically in this browser while you type, so the experience feels more like a real app.
              </p>

              {reportSubmitted ? (
                <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
                  <div className="w-12 h-12 rounded-sm bg-green-50 border border-green-200 flex items-center justify-center">
                    <CheckCircle size={22} className="text-green-700" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground mb-1">Report submitted</p>
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                      Your issue has been logged. Check your email for a 311 reference number within 24 hours.
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleReport} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1.5">
                      Issue Title
                    </label>
                    <input
                      value={reportForm.title}
                      onChange={(e) => setReportForm((p) => ({ ...p, title: e.target.value }))}
                      placeholder="e.g. Pothole on Elgin St near Gladstone"
                      className="w-full px-3 py-2.5 bg-secondary border border-border rounded-sm text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent transition-shadow"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1.5">
                        Category
                      </label>
                      <select
                        value={reportForm.category}
                        onChange={(e) => setReportForm((p) => ({ ...p, category: e.target.value }))}
                        className="w-full px-3 py-2.5 bg-secondary border border-border rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                      >
                        {Object.keys(CATEGORY_CONFIG).map((c) => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1.5">
                        Intersection
                      </label>
                      <input
                        value={reportForm.location}
                        onChange={(e) => setReportForm((p) => ({ ...p, location: e.target.value }))}
                        placeholder="Elgin & Gladstone"
                        className="w-full px-3 py-2.5 bg-secondary border border-border rounded-sm text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1.5">
                      Description
                    </label>
                    <textarea
                      value={reportForm.description}
                      onChange={(e) => setReportForm((p) => ({ ...p, description: e.target.value }))}
                      placeholder="Describe the issue — size, severity, how long it has existed..."
                      rows={3}
                      className="w-full px-3 py-2.5 bg-secondary border border-border rounded-sm text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent resize-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1.5">
                      Photo — optional
                    </label>
                    <label className="flex items-center gap-3 border-2 border-dashed border-border rounded-sm p-3 cursor-pointer hover:border-accent/40 transition-colors group">
                      <Camera size={16} className="text-muted-foreground group-hover:text-accent transition-colors flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">Upload a photo of the issue</span>
                      <input type="file" accept="image/*" className="hidden" />
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-accent text-primary font-semibold py-3 rounded-sm flex items-center justify-center gap-2 hover:bg-accent/90 transition-all duration-200 hover:-translate-y-0.5 text-sm mt-1"
                  >
                    <MapPin size={15} />
                    Submit Report to Ottawa 311
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Issues Feed ────────────────────────────────────────────── */}
      <section id="issues" className="bg-background py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-5">
            <div>
              <span className="font-mono text-[10px] text-accent tracking-[0.22em] uppercase">Community</span>
              <h2 className="font-display text-4xl sm:text-5xl text-foreground mt-2 tracking-tight">Open Reports</h2>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {["All", ...Object.keys(CATEGORY_CONFIG)].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-3 py-1.5 rounded-sm text-[10px] font-mono tracking-wide border transition-colors ${
                    filterCategory === cat
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-foreground border-border hover:border-foreground/20"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6 flex flex-col gap-2 rounded-sm border border-border bg-card/80 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">Polished interactions, no backend required</p>
              <p className="text-xs text-muted-foreground">Save reports for later and keep your draft in place while you explore the app.</p>
            </div>
            <div className="rounded-sm border border-border bg-background/70 px-3 py-2 text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
              {savedIssueIds.length} saved locally
            </div>
          </div>

          {visibleIssues.length === 0 ? (
            <div className="rounded-sm border border-dashed border-border bg-card/70 p-8 text-center text-sm text-muted-foreground">
              No issues match this filter yet. Try a different category or reset the view.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleIssues.map((issue) => {
              const cfg = CATEGORY_CONFIG[issue.category] || { color: "#555", bg: "#eee" };
              const statusCfg = STATUS_CONFIG[issue.status];
              const StatusIcon = statusCfg.Icon;
              const hasVoted = votes[issue.id];
              const isSaved = savedIssueIds.includes(issue.id);
              return (
                <div
                  key={issue.id}
                  className="bg-card border border-border rounded-sm p-5 hover:shadow-lg transition-all duration-200 hover:-translate-y-1 group"
                >
                  <div className="flex items-start justify-between mb-3 gap-2">
                    <span
                      className="text-[10px] font-mono px-2 py-1 rounded-sm tracking-wide"
                      style={{ color: cfg.color, backgroundColor: cfg.bg }}
                    >
                      {issue.category}
                    </span>
                    <span
                      className="text-[10px] font-mono px-2 py-1 rounded-sm flex items-center gap-1 tracking-wide flex-shrink-0"
                      style={{ color: statusCfg.color, backgroundColor: statusCfg.bg }}
                    >
                      <StatusIcon size={9} />
                      {issue.status}
                    </span>
                  </div>

                  <h3 className="font-semibold text-card-foreground text-sm leading-snug mb-2 group-hover:text-accent transition-colors">
                    {issue.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-4">{issue.description}</p>

                  <div className="flex items-center justify-between pt-3 border-t border-border gap-2">
                    <span className="font-mono text-[10px] text-muted-foreground">{issue.date}</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleSavedIssue(issue.id)}
                        aria-pressed={isSaved}
                        className={`flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-1.5 rounded-sm border transition-colors ${
                          isSaved
                            ? "bg-accent/10 border-accent/30 text-accent"
                            : "border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground"
                        }`}
                      >
                        {isSaved ? <BookmarkCheck size={9} /> : <Bookmark size={9} />}
                        {isSaved ? "Saved" : "Save"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleVote(issue.id)}
                        className={`flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-1.5 rounded-sm border transition-colors ${
                          hasVoted
                            ? "bg-accent/10 border-accent/30 text-accent"
                            : "border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground"
                        }`}
                      >
                        <ThumbsUp size={9} />
                        {issue.votes + (hasVoted ? 1 : 0)} support
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          )}
        </div>
      </section>

      {/* ── Civic Literacy ─────────────────────────────────────────── */}
      <section id="learn" className="bg-primary py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10">
            <span className="font-mono text-[10px] text-accent/80 tracking-[0.22em] uppercase">Civic Literacy</span>
            <h2 className="font-display text-4xl sm:text-5xl text-primary-foreground mt-2 tracking-tight">
              Understand Your City
            </h2>
            <p className="text-primary-foreground/50 mt-3 max-w-xl text-sm leading-relaxed">
              Municipal government is closer to your daily life than any other level. Here is how it works.
            </p>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-10 border-b border-white/10 pb-0">
            {LEARN_SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => setLearnTab(s.id)}
                className={`px-4 py-2.5 text-xs font-mono tracking-widest uppercase transition-colors rounded-t-sm -mb-px border-b-2 ${
                  learnTab === s.id
                    ? "text-accent border-accent bg-white/5"
                    : "text-primary-foreground/40 border-transparent hover:text-primary-foreground/70"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            <div className="md:col-span-2 space-y-5">
              <h3 className="font-display text-3xl text-primary-foreground tracking-tight">
                {activeLearn.heading}
              </h3>
              {activeLearn.body.map((para, i) => (
                <p key={i} className="text-primary-foreground/60 leading-relaxed text-sm sm:text-base">
                  {para}
                </p>
              ))}
            </div>

            <div className="space-y-4">
              <div className="bg-accent/10 border border-accent/20 rounded-sm p-6">
                <div className="font-display text-5xl text-accent mb-2">{activeLearn.stat}</div>
                <div className="font-mono text-[10px] text-primary-foreground/40 tracking-wide leading-relaxed uppercase">
                  {activeLearn.statLabel}
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-sm p-5">
                <p className="text-[10px] font-mono text-accent tracking-[0.2em] uppercase mb-4">Take Action</p>
                <div className="space-y-3">
                  {[
                    "Find your ward & councillor at ottawa.ca",
                    "Attend an upcoming public consultation",
                    "File a service request via 311",
                    "Register to delegate at a committee meeting",
                  ].map((action) => (
                    <div key={action} className="flex items-start gap-2.5 text-sm text-primary-foreground/60">
                      <ChevronRight size={12} className="text-accent flex-shrink-0 mt-0.5" />
                      <span className="leading-snug">{action}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Directory ──────────────────────────────────────────────── */}
      <section id="directory" className="bg-secondary py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-5">
            <div>
              <span className="font-mono text-[10px] text-accent tracking-[0.22em] uppercase">
                Municipal Contacts
              </span>
              <h2 className="font-display text-4xl sm:text-5xl text-foreground mt-2 tracking-tight">
                Who to Call
              </h2>
            </div>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                placeholder="Search contacts..."
                className="pl-9 pr-4 py-2.5 bg-card border border-border rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-accent w-full sm:w-60 placeholder:text-muted-foreground"
              />
            </div>
          </div>

          {visibleContacts.length === 0 ? (
            <div className="mb-10 rounded-sm border border-dashed border-border bg-card/70 p-8 text-center text-sm text-muted-foreground">
              No contacts match “{contactSearch}” yet. Try a broader search term.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
              {visibleContacts.map((c) => (
                <div
                  key={c.name}
                  className="bg-card border border-border rounded-sm p-5 hover:shadow-lg transition-all duration-200 hover:-translate-y-1 group"
                >
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-9 h-9 rounded-sm bg-primary/8 border border-border flex items-center justify-center flex-shrink-0">
                    <Building2 size={15} className="text-primary/50" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-card-foreground text-sm leading-tight group-hover:text-accent transition-colors">
                      {c.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{c.role}</p>
                  </div>
                </div>

                <div className="space-y-2 border-t border-border pt-3">
                  <a
                    href={`tel:${c.phone}`}
                    className="flex items-center gap-2 text-xs text-foreground hover:text-accent transition-colors"
                  >
                    <Phone size={11} className="text-muted-foreground flex-shrink-0" />
                    {c.phone}
                  </a>
                  <a
                    href={`mailto:${c.email}`}
                    className="flex items-center gap-2 text-xs text-foreground hover:text-accent transition-colors truncate"
                  >
                    <Mail size={11} className="text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{c.email}</span>
                  </a>
                </div>
              </div>
            ))}
            </div>
          )}

          {/* 311 CTA banner */}
          <div className="bg-primary rounded-sm p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div>
              <h3 className="font-display text-2xl text-primary-foreground tracking-tight">
                Not sure who to contact?
              </h3>
              <p className="text-primary-foreground/50 text-sm mt-1 max-w-md leading-relaxed">
                Ottawa 311 handles all non-emergency city service requests and will route your issue to the right department.
              </p>
            </div>
            <a
              href="tel:311"
              className="bg-accent text-primary font-semibold px-6 py-3.5 rounded-sm flex items-center gap-2 hover:bg-accent/90 transition-colors text-sm flex-shrink-0 whitespace-nowrap"
            >
              <Phone size={15} />
              Call 3-1-1
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="bg-primary border-t border-white/8 py-14 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 bg-accent rounded-sm flex items-center justify-center">
                <MapPin size={13} className="text-primary" />
              </div>
              <span className="font-display text-lg text-primary-foreground">Local Voice</span>
            </div>
            <p className="text-primary-foreground/40 text-sm leading-relaxed max-w-xs">
              A civic-tech pilot enabling Ottawa residents to report local issues, track city responses, and increase informed participation in municipal government.
            </p>
            <p className="text-primary-foreground/30 text-xs font-mono mt-4 leading-relaxed">
              Supported by GLOCAL Foundation&apos;s CANConnect Micro-grant program (Canada Service Corps).
            </p>
          </div>

          <div>
            <p className="font-mono text-[10px] text-accent/70 tracking-[0.2em] uppercase mb-4">Navigate</p>
            <div className="space-y-2.5">
              {NAV_LINKS.map((l) => (
                <button
                  key={l.id}
                  onClick={() => scrollTo(l.id)}
                  className="block text-sm text-primary-foreground/40 hover:text-primary-foreground/80 transition-colors"
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="font-mono text-[10px] text-accent/70 tracking-[0.2em] uppercase mb-4">Resources</p>
            <div className="space-y-2.5">
              {[
                "ottawa.ca / 311",
                "Ottawa Ward Finder",
                "City Council Calendar",
                "Budget Consultations",
                "Public Delegations",
              ].map((r) => (
                <div
                  key={r}
                  className="flex items-center gap-1.5 text-sm text-primary-foreground/40 hover:text-primary-foreground/80 transition-colors cursor-pointer"
                >
                  {r}
                  <ExternalLink size={9} className="flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mt-12 pt-6 border-t border-white/8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <p className="font-mono text-[10px] text-primary-foreground/25 tracking-wide">
            &copy; 2026 Local Voice &middot; Ottawa, Ontario &middot; CANConnect Micro-grant Recipient
          </p>
          <p className="font-mono text-[10px] text-primary-foreground/25 tracking-wide">
            GLOCAL Foundation &middot; Canada Service Corps
          </p>
        </div>
      </footer>
    </div>
  );
}
