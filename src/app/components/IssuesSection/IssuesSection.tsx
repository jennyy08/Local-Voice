 
import { Bookmark, BookmarkCheck, ThumbsUp } from "lucide-react";
import { CATEGORY_CONFIG, STATUS_CONFIG } from "../../../data/constants"; 
import { type Dispatch, type SetStateAction } from "react"
 
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
};

type IssuesSectionProps = {
  filterCategory: string;
  setFilterCategory: (category: string) => void;
  savedIssueIds: string[];
  issuesLoading: boolean;
  visibleIssues: Issue[];
  votes: Record<string, boolean>; 
  setSelectedIssue: (issue: Issue) => void;
  toggleSavedIssue: (id: string) => void;
  handleVote: (issue: Issue) => void;
};

export default function IssuesSection({filterCategory,
  setFilterCategory,
  savedIssueIds,
  issuesLoading,
  visibleIssues,
  votes,
  setSelectedIssue,
  toggleSavedIssue,
  handleVote,
}: IssuesSectionProps) {
    return (
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
    )
}