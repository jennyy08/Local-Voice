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
  runTransaction,
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
import Hero from "./components/hero";
import Directory from "./components/Directory/DirectorySection";
import Footer from "./components/Footer";
import LearnSection from "./components/LearnSection";
import IssuesSection from "./components/IssuesSection/IssuesSection"
import IssueModal from "./components/IssuesSection/IssueModal"
import MapSection from "./components/MapSection/MapSection"

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
  const [showSavedOnly, setShowSavedOnly] = useState(false);
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

  useEffect(() => {
    try {
      const storedVotes = window.localStorage.getItem("localvoice-votes");
      if (storedVotes) {
        setVotes(JSON.parse(storedVotes));
      }
    } catch {
      // Ignore invalid saved vote state
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("localvoice-votes", JSON.stringify(votes));
  }, [votes]);

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
    const alreadySupported = !!votes[issue.id];
    const nextSupported = !alreadySupported;

    setVotes((prev) => ({ ...prev, [issue.id]: nextSupported }));

    try {
      const issueRef = doc(db, "reports", issue.id);
      await runTransaction(db, async (transaction) => {
        const snapshot = await transaction.get(issueRef);
        const currentVotes = Number(snapshot.data()?.votes ?? 0);
        const nextVotes = Math.max(0, currentVotes + (nextSupported ? 1 : -1));
        transaction.update(issueRef, { votes: nextVotes });
      });
    } catch (err) {
      console.error("Failed to update support:", err);
      setVotes((prev) => {
        const next = { ...prev };
        next[issue.id] = alreadySupported;
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

  const openReportsCount = issues.filter((issue) => issue.status === "Open").length;
  const communitySupportsCount = issues.reduce(
    (total, issue) => total + (Number(issue.votes) || 0),
    0
  );

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
      <Hero scrollTo={scrollTo} />
      
      <MapSection 
          // MapView props
          locatingUser={locatingUser}
          mapCenter={mapCenter}
          userLocation={userLocation}
          visibleIssues={visibleIssues}
          draftPin={draftPin}
          filterCategory={filterCategory}
          setFilterCategory={setFilterCategory}
          RecenterMap={RecenterMap}
          MapClickHandler={MapClickHandler}
          handleMapClick={handleMapClick}
          youAreHereIcon={youAreHereIcon}
          categoryDivIcon={categoryDivIcon}
          draftPinIcon={draftPinIcon}
          
          // ReportForm props
          reportSubmitted={reportSubmitted}
          submitting={submitting}
          submitError={submitError}
          reportForm={reportForm}
          setReportForm={setReportForm}
          handleReport={handleReport}
          photoDataUrl={photoDataUrl}
          setPhotoFile={setPhotoFile}
          setPhotoDataUrl={setPhotoDataUrl}
          handlePhotoChange={handlePhotoChange}
        />

      <IssuesSection 
        filterCategory={filterCategory}
        setFilterCategory={setFilterCategory}
        savedIssueIds={savedIssueIds}
        issuesLoading={issuesLoading}
        visibleIssues={visibleIssues}
        votes={votes}
        setSelectedIssue={setSelectedIssue}
        toggleSavedIssue={toggleSavedIssue}
        handleVote={handleVote}
        openReportsCount={openReportsCount}
        communitySupportsCount={communitySupportsCount}
        showSavedOnly={showSavedOnly}
        setShowSavedOnly={setShowSavedOnly}
      />

      <LearnSection 
        learnTab={learnTab}
        setLearnTab={setLearnTab}
        activeLearn={activeLearn}
      />

      <Directory contactSearch={contactSearch} setContactSearch={setContactSearch} visibleContacts={visibleContacts} />
      
      <Footer scrollTo={scrollTo}/>
      
      <IssueModal
        modalIssue={modalIssue}
        setSelectedIssue={setSelectedIssue}
        savedIssueIds={savedIssueIds}
        toggleSavedIssue={toggleSavedIssue}
        votes={votes}
        handleVote={handleVote}
      />
    </div>
  );
}