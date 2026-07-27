import { type Dispatch, type SetStateAction } from "react";
import { Camera, MapPin, X } from "lucide-react";
import { CATEGORY_CONFIG } from "../../../data/constants"

// Define the shape of your form state
type ReportFormState = {
  title: string;
  category: string;
  location: string;
  description: string;
};

type ReportFormProps = {
  reportSubmitted: boolean;
  submitting: boolean;
  submitError: string | null;
  reportForm: ReportFormState;
  setReportForm: Dispatch<SetStateAction<ReportFormState>>;
  handleReport: (e: React.FormEvent) => void;
  photoDataUrl: string | null;
  setPhotoFile: Dispatch<SetStateAction<File | null>>;
  setPhotoDataUrl: Dispatch<SetStateAction<string | null>>;
  handlePhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export default function ReportForm({
  reportSubmitted,
  submitting,
  submitError,
  reportForm,
  setReportForm,
  handleReport,
  photoDataUrl,
  setPhotoFile,
  setPhotoDataUrl,
  handlePhotoChange,
}: ReportFormProps) {
  return (
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
  );
}