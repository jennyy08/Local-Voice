import { type Dispatch, type SetStateAction } from "react";
import { X, Bookmark, BookmarkCheck, ThumbsUp } from "lucide-react";
import { CATEGORY_CONFIG, STATUS_CONFIG } from "../../../data/constants";

type Issue = {
  id: string;
  category: string;
  status: string;
  title: string;
  description: string;
  date: string;
  votes: number;
  lat: number;
  lng: number;
  photo?: string; 
};

type IssueModalProps = {
  modalIssue: Issue | null;
  setSelectedIssue: Dispatch<SetStateAction<Issue | null>>;
  savedIssueIds: string[];
  toggleSavedIssue: (id: string) => void;
  votes: Record<string, boolean>;
  handleVote: (issue: Issue) => void;
};

export default function IssueModal ({
    modalIssue,
    setSelectedIssue,
    savedIssueIds,
    toggleSavedIssue,
    votes,
    handleVote,
}: IssueModalProps) {
    if (!modalIssue) return null;

    return (
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
    );
}