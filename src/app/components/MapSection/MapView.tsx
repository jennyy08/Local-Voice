import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { CATEGORY_CONFIG } from "../../../data/constants";

// Make sure your Issue type perfectly matches the one from IssuesSection!
type Issue = {
  id: string;
  category: string;
  status: string;
  title: string;
  date: string;
  lat: number;
  lng: number;
};

type MapViewProps = {
  locatingUser: boolean;
  mapCenter: [number, number];
  userLocation: [number, number] | null;
  visibleIssues: Issue[];
  draftPin: { lat: number; lng: number } | null;
  filterCategory: string;
  setFilterCategory: (category: string) => void;
  // Passing these down from wherever they were originally defined
  RecenterMap: any; 
  MapClickHandler: any; 
  handleMapClick: any;
  youAreHereIcon: any;
  categoryDivIcon: any;
  draftPinIcon: any;
};

export default function MapView({
  locatingUser,
  mapCenter,
  userLocation,
  visibleIssues,
  draftPin,
  filterCategory,
  setFilterCategory,
  RecenterMap,
  MapClickHandler,
  handleMapClick,
  youAreHereIcon,
  categoryDivIcon,
  draftPinIcon,
}: MapViewProps) {
  return (
    <div className="lg:col-span-3 relative rounded-sm overflow-hidden shadow-lg bg-[#E8E2D8]" style={{ height: 460 }}>
      {locatingUser && (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-[#E8E2D8]">
          <p className="font-mono text-xs text-muted-foreground tracking-widest uppercase">
            Finding your location…
          </p>
        </div>
      )}

      <MapContainer center={mapCenter} zoom={13} scrollWheelZoom style={{ width: "100%", height: "100%" }}>
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
            <Marker key={issue.id} position={[issue.lat, issue.lng]} icon={categoryDivIcon(cfg.color)}>
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
  );
}