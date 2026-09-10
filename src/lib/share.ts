import { toast } from "sonner";

type ShareableIssue = {
  id: string;
  title: string;
  category: string;
};

/**
 * Builds a permalink to a single report, e.g. https://site.com/?report=<id>
 * App.tsx reads this param on load and opens the matching report.
 */
export function buildReportUrl(issueId: string): string {
  return `${window.location.origin}${window.location.pathname}?report=${issueId}`;
}

/**
 * Shares a report using the OS-native share sheet where available
 * (most mobile browsers, macOS Safari, Chrome/Edge on Windows).
 *
 * Falls back to copying the link to the clipboard with a toast on
 * browsers that don't support the Web Share API (e.g. Firefox desktop),
 * so every visitor gets a working share action.
 */
export async function shareReport(issue: ShareableIssue): Promise<void> {
  const url = buildReportUrl(issue.id);
  const shareData: ShareData = {
    title: `Local Voice — ${issue.title}`,
    text: `${issue.title} (${issue.category}) — reported on Local Voice`,
    url,
  };

  // Try the native share sheet first
  if (typeof navigator.share === "function" && navigator.canShare?.(shareData) !== false) {
    try {
      await navigator.share(shareData);
      return;
    } catch (err) {
      // The user closing/cancelling the share sheet throws AbortError —
      // that's not a failure, so don't fall back or show an error.
      if ((err as Error)?.name === "AbortError") return;
      // Any other error: fall through to the clipboard fallback.
    }
  }

  // Fallback: copy the link
  try {
    await navigator.clipboard.writeText(url);
    toast.success("Link copied", {
      description: "Share it so more residents can support this report.",
    });
  } catch {
    toast.error("Couldn't share this report", {
      description: "Try copying the page link from your browser instead.",
    });
  }
}
