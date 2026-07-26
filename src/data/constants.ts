import { AlertCircle, CheckCircle, Clock } from "lucide-react";

// Ottawa fallback center, used if geolocation is denied/unavailable.
export const OTTAWA_CENTER: [number, number] = [45.4215, -75.6919];

export const CATEGORY_CONFIG: Record<string, { color: string; bg: string }> = {
  Roads: { color: "#DC4E28", bg: "#FEF2EE" },
  Lighting: { color: "#A96200", bg: "#FEF7E8" },
  Waste: { color: "#1A7A4A", bg: "#EBF9F0" },
  Parks: { color: "#1E6E8A", bg: "#EAF4F9" },
  Graffiti: { color: "#6B2D8E", bg: "#F5EDF9" },
  "Snow & Ice": { color: "#1D4ED8", bg: "#EEF3FE" },
};

export const STATUS_CONFIG: Record<string, { color: string; bg: string; Icon: typeof CheckCircle }> = {
  Open: { color: "#92400E", bg: "#FEF3C7", Icon: AlertCircle },
  Pending: { color: "#92400E", bg: "#FEF3C7", Icon: AlertCircle },
  "In Review": { color: "#1E3A8A", bg: "#DBEAFE", Icon: Clock },
  Resolved: { color: "#14532D", bg: "#DCFCE7", Icon: CheckCircle },
};

export const NAV_LINKS = [
  { id: "home", label: "Home" },
  { id: "map", label: "Report" },
  { id: "issues", label: "Issues" },
  { id: "learn", label: "Learn" },
  { id: "directory", label: "Directory" },
];