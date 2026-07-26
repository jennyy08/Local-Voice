import { useEffect, useState, type FormEvent, type ChangeEvent } from "react";
import L from "leaflet";
//@ts-ignore
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  limit as fsLimit,
  doc,
  updateDoc,
  increment,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

import { db, storage } from "../lib/firebase";
import {
  MapPin, Camera, Phone, BookOpen, Search, Menu, X,
  Mail, CheckCircle, Clock, AlertCircle, ChevronRight,
  Building2, ExternalLink, ThumbsUp, Moon, Sun, Bookmark, BookmarkCheck,
} from "lucide-react";

import { CONTACTS } from "../data/contacts";
import { LEARN_SECTIONS } from "../data/learnSections";
import { SEED_ISSUES } from "../data/seedIssues";
import {
    CATEGORY_CONFIG,
    STATUS_CONFIG,
    NAV_LINKS,
    OTTAWA_CENTER,
} from "../data/constants";

import type { Issue } from "../types/issue";
import Navbar from "./components/Navbar";

// ── Data ─────────────────────────────────────────────────────────────────────

// Seed data used to populate Firestore the very first time the "reports"
// collection is empty (e.g. a brand new Firebase project). After that,
// Firestore is the single source of truth shared by every visitor.

// ── Leaflet helpers ────────────────────────────────────────────────────────

// Builds a colored circular pin matching the app's existing marker look,
// using a plain divIcon since Leaflet can't render React components as markers directly.
function categoryDivIcon(color: string, opts?: { dashed?: boolean }) {
  return L.divIcon({
    className: "",
    html: `<div style="
      width: 22px; height: 22px; border-radius: 9999px;
      background:${color}; border:2px solid ${opts?.dashed ? "transparent" : "white"};
      ${opts?.dashed ? `outline: 2px dashed ${color}; outline-offset: 2px;` : ""}
      box-shadow: 0 1px 4px rgba(0,0,0,0.35);
    "></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -11],
  });
}

const youAreHereIcon = L.divIcon({
  className: "",
  html: `<div style="
    width: 16px; height: 16px; border-radius: 9999px;
    background:#0B1F3A; border:3px solid #F2EDE4;
    box-shadow: 0 1px 4px rgba(0,0,0,0.4);
  "></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const draftPinIcon = categoryDivIcon("#F2A73B", { dashed: true });

// Recenters the map whenever `center` changes (e.g. once geolocation resolves).
function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
}

// Listens for map clicks so a resident can drop a pin to start a new report.
function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const [activeSection, setActiveSection] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);
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
  const [votes, setVotes] = useState<Record<string, boolean>>({});
  const [darkMode, setDarkMode] = useState(false);
  const [savedIssueIds, setSavedIssueIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Community-submitted reports, live-synced from Firestore so every visitor
  // sees the same shared feed in real time (not just their own browser).
  const [issues, setIssues] = useState<Issue[]>([]);
  const [issuesLoading, setIssuesLoading] = useState(true);

  // Real map state: user's live location, and the draft pin they drop to report a new issue.
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locatingUser, setLocatingUser] = useState(true);
  const [draftPin, setDraftPin] = useState<{ lat: number; lng: number } | null>(null);

  // Detail modal: which report (if any) is currently expanded for a closer look.
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  // Photo attached to the report currently being drafted. We keep the raw
  // File for uploading to Firebase Storage, plus a data URL just for the
  // in-form preview.
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);

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

  // Ask for the resident's location once on load so the map opens centered on them.
  // Falls back to the Ottawa city-wide center if permission is denied or unavailable.
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocatingUser(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude]);
        setLocatingUser(false);
      },
      () => {
        setLocatingUser(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
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

  // Subscribe to the shared "reports" collection in Firestore so every
  // visitor sees the same live feed. Falls back to seeding the pilot data
  // once, the very first time the collection is empty (e.g. a fresh
  // Firebase project) so the app isn't blank on first launch.
  useEffect(() => {
    const reportsQuery = query(collection(db, "reports"), orderBy("createdAt", "desc"), fsLimit(200));

    const unsubscribe = onSnapshot(
      reportsQuery,
      async (snapshot) => {
        if (snapshot.empty && !window.localStorage.getItem("localvoice-seeded")) {
          window.localStorage.setItem("localvoice-seeded", "true");
          try {
            await Promise.all(
              SEED_ISSUES.map((seed) =>
                addDoc(collection(db, "reports"), { ...seed, createdAt: serverTimestamp() })
              )
            );
          } catch (err) {
            console.error("Failed to seed initial reports:", err);
          }
          return; // the seed writes will trigger another snapshot with real data
        }

        const live: Issue[] = snapshot.docs.map((doc) => {
          const data = doc.data() as Omit<Issue, "id">;
          return { id: doc.id, ...data };
        });
        setIssues(live);
        setIssuesLoading(false);
      },
      (err) => {
        console.error("Failed to load reports from Firestore:", err);
        setIssuesLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Close the detail modal on Escape, and lock body scroll while it's open.
  useEffect(() => {
    if (!selectedIssue) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedIssue(null);
    };
    window.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [selectedIssue]);

  const scrollTo = (id: string) => {
    setActiveSection(id);
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  // Supports a report for everyone (real Firestore write, not just local
  // state). Uses increment() so concurrent votes from different visitors
  // don't clobber each other. Each browser can only support a given report
  // once per session — this isn't real per-user auth, just a lightweight
  // guard against accidental double-clicks/spam for a pilot.
  const handleVote = async (issue: Issue) => {
    if (votes[issue.id]) return; // already supported this session

    setVotes((prev) => ({ ...prev, [issue.id]: true })); // optimistic

    try {
      const issueRef = doc(db, "reports", issue.id);
      await updateDoc(issueRef, {
        votes: increment(1),
      });
    } catch (err) {
      console.error("Failed to update support:", err);
      // Roll back the optimistic local state so the button re-enables —
      // most likely cause is Firestore rules blocking the update.
      setVotes((prev) => {
        const next = { ...prev };
        delete next[issue.id];
        return next;
      });
    }
  };

  const toggleSavedIssue = (id: string) => {
    setSavedIssueIds((prev) =>
      prev.includes(id) ? prev.filter((savedId) => savedId !== id) : [...prev, id]
    );
  };

  // Called when a resident clicks anywhere on the map: drops a draft pin and
  // reverse-geocodes it into a readable address for the report form.
  const handleMapClick = (lat: number, lng: number) => {
    setDraftPin({ lat, lng });
    setReportForm((p) => ({ ...p, location: "Locating address…" }));

    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
      .then((r) => r.json())
      .then((data) => {
        const address = data?.display_name
          ? data.display_name.split(",").slice(0, 2).join(",").trim()
          : `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        setReportForm((p) => ({ ...p, location: address }));
      })
      .catch(() => {
        setReportForm((p) => ({ ...p, location: `${lat.toFixed(5)}, ${lng.toFixed(5)}` }));
      });
  };

  // Keeps the raw File for uploading later, and builds a quick local preview URL.
  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setPhotoFile(null);
      setPhotoDataUrl(null);
      return;
    }
    setPhotoFile(file);
    setPhotoDataUrl(URL.createObjectURL(file));
  };

  const handleReport = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);

    try {
      // Use the pin the resident dropped on the map; if they typed a location
      // manually without clicking the map, fall back to their live location
      // (or the Ottawa center) so the report still gets created instead of
      // silently doing nothing.
      const pin =
        draftPin ??
        (userLocation
          ? { lat: userLocation[0], lng: userLocation[1] }
          : { lat: OTTAWA_CENTER[0], lng: OTTAWA_CENTER[1] });

      let photoUrl: string | null = null;
      if (photoFile) {
        const photoRef = ref(storage, `reports/${Date.now()}-${photoFile.name}`);
        await uploadBytes(photoRef, photoFile);
        photoUrl = await getDownloadURL(photoRef);
      }

      await addDoc(collection(db, "reports"), {
        title: reportForm.title.trim(),
        category: reportForm.category,
        status: "Open",
        date: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        votes: 0,
        lat: pin.lat,
        lng: pin.lng,
        description: reportForm.description.trim(),
        photo: photoUrl,
        createdAt: serverTimestamp(),
      });
      // No need to manually update `issues` — the Firestore onSnapshot
      // listener above picks up the new report and updates everyone's view.

      setReportSubmitted(true);
      setTimeout(() => setReportSubmitted(false), 5000);
      setReportForm({ title: "", category: "Roads", description: "", location: "" });
      setDraftPin(null);
      setPhotoFile(null);
      setPhotoDataUrl(null);
    } catch (err) {
      console.error("Failed to submit report:", err);
      setSubmitError("Something went wrong submitting your report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const visibleIssues =
    filterCategory === "All" ? issues : issues.filter((i) => i.category === filterCategory);

  const visibleContacts = CONTACTS.filter(
    (c) =>
      c.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
      c.role.toLowerCase().includes(contactSearch.toLowerCase())
  );

  const activeLearn = LEARN_SECTIONS.find((s) => s.id === learnTab)!;
  const mapCenter = userLocation ?? OTTAWA_CENTER;

  // Keep the modal in sync with the live Firestore feed — selectedIssue is
  // just "which report is open," the actual data (like vote count) always
  // comes from the current `issues` list so it updates in real time.
  const modalIssue = selectedIssue
    ? issues.find((i) => i.id === selectedIssue.id) ?? selectedIssue
    : null;

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Navbar
        activeSection={activeSection}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        scrollTo={scrollTo}
      />

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

      {/* ── Map + Report ───────────────────────────────────────────── */}
      <section id="map" className="bg-secondary py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10">
            <span className="font-mono text-[10px] text-accent tracking-[0.22em] uppercase">Interactive Map</span>
            <h2 className="font-display text-4xl sm:text-5xl text-foreground mt-2 tracking-tight">
              Report an Issue
            </h2>
            <p className="text-muted-foreground mt-3 max-w-lg text-sm leading-relaxed">
              Click anywhere on the map to drop a pin at that location, or select an existing pin to see its report. Reports are added to the community feed for everyone to see — for urgent issues, contact Ottawa 311 directly.
            </p>
          </div>

          <div className="grid lg:grid-cols-5 gap-6 items-start">
            {/* Map */}
            <div
              className="lg:col-span-3 relative rounded-sm overflow-hidden shadow-lg bg-[#E8E2D8]"
              style={{ height: 460 }}
            >
              {locatingUser && (
                <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-[#E8E2D8]">
                  <p className="font-mono text-xs text-muted-foreground tracking-widest uppercase">
                    Finding your location…
                  </p>
                </div>
              )}

              <MapContainer
                center={mapCenter}
                zoom={13}
                scrollWheelZoom
                style={{ width: "100%", height: "100%" }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <RecenterMap center={mapCenter} />
                <MapClickHandler onMapClick={handleMapClick} />

                {userLocation && (
                  <Marker position={userLocation} icon={youAreHereIcon}>
                    <Popup>You are here</Popup>
                  </Marker>
                )}

                {visibleIssues.map((issue) => {
                  const cfg = CATEGORY_CONFIG[issue.category] || { color: "#555", bg: "#eee" };
                  return (
                    <Marker
                      key={issue.id}
                      position={[issue.lat, issue.lng]}
                      icon={categoryDivIcon(cfg.color)}
                    >
                      <Popup>
                        <p className="text-xs font-semibold leading-tight mb-1">{issue.title}</p>
                        <p className="text-[11px] font-mono text-muted-foreground">
                          {issue.category} · {issue.status}
                        </p>
                        <p className="text-[11px] font-mono text-muted-foreground">{issue.date}</p>
                      </Popup>
                    </Marker>
                  );
                })}

                {draftPin && (
                  <Marker position={[draftPin.lat, draftPin.lng]} icon={draftPinIcon}>
                    <Popup>New report location — fill out the form to submit</Popup>
                  </Marker>
                )}
              </MapContainer>

              {/* Category filter overlay */}
              <div className="absolute top-3 right-3 z-[1000] flex flex-wrap gap-1 justify-end max-w-[180px]">
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
              <div className="absolute bottom-3 left-3 z-[1000] bg-card/90 rounded-sm p-2.5 border border-border/50 shadow">
                <p className="font-mono text-[9px] text-muted-foreground mb-1.5 tracking-widest uppercase">Map Legend</p>
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-2 h-2 rounded-full bg-[#0B1F3A]" />
                  <span className="font-mono text-[10px] text-foreground">Your location</span>
                </div>
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-2 h-2 rounded-full bg-[#DC4E28]" />
                  <span className="font-mono text-[10px] text-foreground">Reported issue</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full border border-dashed border-[#F2A73B]" />
                  <span className="font-mono text-[10px] text-foreground">New report (click map)</span>
                </div>
              </div>
            </div>

            {/* Report form */}
            <div className="lg:col-span-2 bg-card border border-border rounded-sm p-6 shadow-sm">
              <h3 className="font-display text-2xl text-foreground mb-0.5 tracking-tight">Submit a Report</h3>
              <p className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase mb-6">
                Community Awareness Feed
              </p>
              <p className="mb-5 text-xs text-muted-foreground leading-relaxed">
                Click a location on the map to auto-fill it below, or type it manually. Your draft is saved locally while you type; submitted reports are shared with everyone.
              </p>

              {reportSubmitted ? (
                <div className="space-y-4 py-6">
                  <div className="rounded-sm border border-emerald-200 bg-emerald-50 p-4">
                    <p className="font-semibold text-emerald-800">Report added to Open Reports</p>
                    <p className="text-sm text-emerald-700 mt-1">
                      This is a community awareness post, not an automatic 311 submission.
                    </p>
                  </div>

                  <div className="rounded-sm border border-border bg-secondary p-4">
                    <p className="text-sm font-semibold text-foreground mb-2">Need urgent help?</p>
                    <p className="text-sm text-muted-foreground mb-2">
                      For urgent city issues, use Ottawa's official 311 channels:
                    </p>
                    <ul className="text-sm text-foreground space-y-1">
                      <li>&bull; Call 3-1-1</li>
                      <li>&bull; Visit ottawa.ca/311</li>
                      <li>&bull; Email client.services@ottawa.ca</li>
                    </ul>
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
                        Location
                      </label>
                      <input
                        value={reportForm.location}
                        onChange={(e) => setReportForm((p) => ({ ...p, location: e.target.value }))}
                        placeholder="Click the map, or type it here"
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
                    {photoDataUrl ? (
                      <div className="relative rounded-sm overflow-hidden border border-border">
                        <img src={photoDataUrl} alt="Selected issue" className="w-full h-32 object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            setPhotoFile(null);
                            setPhotoDataUrl(null);
                          }}
                          className="absolute top-2 right-2 bg-primary/80 text-primary-foreground rounded-sm p-1.5 hover:bg-primary transition-colors"
                          aria-label="Remove photo"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <label className="flex items-center gap-3 border-2 border-dashed border-border rounded-sm p-3 cursor-pointer hover:border-accent/40 transition-colors group">
                        <Camera size={16} className="text-muted-foreground group-hover:text-accent transition-colors flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">Upload a photo of the issue</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                      </label>
                    )}
                  </div>

                  {submitError && (
                    <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-sm px-3 py-2">
                      {submitError}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-accent text-primary font-semibold py-3 rounded-sm flex items-center justify-center gap-2 hover:bg-accent/90 transition-all duration-200 hover:-translate-y-0.5 text-sm mt-1 disabled:opacity-60 disabled:hover:translate-y-0"
                  >
                    <MapPin size={15} />
                    {submitting ? "Submitting…" : "Add to Open Reports"}
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

          {issuesLoading ? (
            <div className="rounded-sm border border-dashed border-border bg-card/70 p-8 text-center text-sm text-muted-foreground">
              Loading community reports…
            </div>
          ) : visibleIssues.length === 0 ? (
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
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedIssue(issue)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") setSelectedIssue(issue);
                  }}
                  className="bg-card border border-border rounded-sm p-5 hover:shadow-lg transition-all duration-200 hover:-translate-y-1 group cursor-pointer text-left"
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
                  <p className="text-xs text-muted-foreground leading-relaxed mb-4 line-clamp-2">{issue.description}</p>

                  <div className="flex items-center justify-between pt-3 border-t border-border gap-2">
                    <span className="font-mono text-[10px] text-muted-foreground">{issue.date}</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSavedIssue(issue.id);
                        }}
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
                        disabled={hasVoted}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVote(issue);
                        }}
                        className={`flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-1.5 rounded-sm border transition-colors ${
                          hasVoted
                            ? "bg-accent/10 border-accent/30 text-accent cursor-default"
                            : "border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground"
                        }`}
                      >
                        <ThumbsUp size={9} />
                        {issue.votes} {hasVoted ? "supported" : "support"}
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
              No contacts match "{contactSearch}" yet. Try a broader search term.
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
            <a
              href="https://glocalfoundation.ca"
              target="_blank"
              rel="noreferrer"
              className="text-primary-foreground/30 text-xs font-mono mt-4 leading-relaxed inline-block hover:text-primary-foreground/60 transition-colors"
            >
              Supported by GLOCAL Foundation&apos;s CANConnect Micro-grant program (Canada Service Corps).
            </a>
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
                { label: "ottawa.ca / 311", href: "https://ottawa.ca/en/3-1-1" },
                { label: "Ottawa Ward Finder", href: "https://ottawa.ca/en/city-hall/council-committees-and-boards/how-city-government-works/find-your-ward-and-councillor" },
                { label: "City Council Calendar", href: "https://ottawa.ca/en/city-hall/council-committees-and-boards/agendas-minutes-and-videos/meetings-agendas-and-minutes" },
                { label: "Budget Consultations", href: "https://ottawa.ca/en/city-hall/council-committees-and-boards/agendas-minutes-and-videos/meetings-agendas-and-minutes" },
                { label: "Public Delegations", href: "https://ottawa.ca/en/city-hall/city-manager-administration-and-policies/policies/administrative-policies/delegation-powers-policy" },
              ].map((resource) => (
                <a
                  key={resource.label}
                  href={resource.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-sm text-primary-foreground/40 hover:text-primary-foreground/80 transition-colors"
                >
                  {resource.label}
                  <ExternalLink size={9} className="flex-shrink-0" />
                </a>
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

      {/* ── Report Detail Modal ────────────────────────────────────── */}
      {modalIssue && (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedIssue(null);
          }}
        >
          <div className="bg-card border border-border rounded-sm shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
            {modalIssue.photo && (
              <img
                src={modalIssue.photo}
                alt={modalIssue.title}
                className="w-full h-48 object-cover"
              />
            )}

            <div className="p-6">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="text-[10px] font-mono px-2 py-1 rounded-sm tracking-wide"
                    style={{
                      color: (CATEGORY_CONFIG[modalIssue.category] || { color: "#555" }).color,
                      backgroundColor: (CATEGORY_CONFIG[modalIssue.category] || { bg: "#eee" }).bg,
                    }}
                  >
                    {modalIssue.category}
                  </span>
                  {(() => {
                    const statusCfg = STATUS_CONFIG[modalIssue.status];
                    const StatusIcon = statusCfg.Icon;
                    return (
                      <span
                        className="text-[10px] font-mono px-2 py-1 rounded-sm flex items-center gap-1 tracking-wide"
                        style={{ color: statusCfg.color, backgroundColor: statusCfg.bg }}
                      >
                        <StatusIcon size={9} />
                        {modalIssue.status}
                      </span>
                    );
                  })()}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedIssue(null)}
                  className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              <h3 className="font-display text-2xl text-foreground tracking-tight mb-3">
                {modalIssue.title}
              </h3>

              <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                {modalIssue.description}
              </p>

              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="rounded-sm border border-border bg-secondary p-3">
                  <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest mb-1">Filed</p>
                  <p className="text-sm text-foreground">{modalIssue.date}</p>
                </div>
                <div className="rounded-sm border border-border bg-secondary p-3">
                  <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest mb-1">Support</p>
                  <p className="text-sm text-foreground">
                    {modalIssue.votes} residents
                  </p>
                </div>
                <div className="rounded-sm border border-border bg-secondary p-3 col-span-2">
                  <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest mb-1">Location</p>
                  <p className="text-sm text-foreground font-mono">
                    {modalIssue.lat.toFixed(5)}, {modalIssue.lng.toFixed(5)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleSavedIssue(modalIssue.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-mono px-3 py-2.5 rounded-sm border transition-colors ${
                    savedIssueIds.includes(modalIssue.id)
                      ? "bg-accent/10 border-accent/30 text-accent"
                      : "border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground"
                  }`}
                >
                  {savedIssueIds.includes(modalIssue.id) ? <BookmarkCheck size={12} /> : <Bookmark size={12} />}
                  {savedIssueIds.includes(modalIssue.id) ? "Saved" : "Save"}
                </button>
                <button
                  type="button"
                  disabled={!!votes[modalIssue.id]}
                  onClick={() => handleVote(modalIssue)}
                  className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-mono px-3 py-2.5 rounded-sm border transition-colors ${
                    votes[modalIssue.id]
                      ? "bg-accent/10 border-accent/30 text-accent cursor-default"
                      : "border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground"
                  }`}
                >
                  <ThumbsUp size={12} />
                  {votes[modalIssue.id] ? "Supported" : "Support"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}