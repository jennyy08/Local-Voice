/**
 * Content moderation via Firebase Cloud Function.
 * The Cloud Function calls OpenAI's moderation API server-side,
 * keeping the API key secure and never exposed to the browser.
 */

import { auth } from "./firebase";

export type ModerationResult = {
  flagged: boolean;
  reason: string | null;
};

// After deploying, your function URL will look like:
// https://moderatecontent-xxxxx.a.run.app
// Set this in your .env so the client knows where to call.
const MODERATION_URL = import.meta.env.VITE_MODERATION_FUNCTION_URL as string | undefined;

/**
 * Sends title, description, and optionally an image to the Cloud Function
 * for moderation. Includes the user's Firebase ID token for authentication.
 *
 * Fail-open: if the function URL isn't set or the request fails,
 * the submission is allowed through.
 */
export async function moderateContent(
  title: string,
  description: string,
  imageBase64?: string | null
): Promise<ModerationResult> {
  if (!MODERATION_URL) {
    console.warn("[moderation] No VITE_MODERATION_FUNCTION_URL set — skipping moderation.");
    return { flagged: false, reason: null };
  }

  try {
    // Get the current user's ID token to authenticate with the Cloud Function
    const user = auth.currentUser;
    if (!user) {
      console.warn("[moderation] No authenticated user — skipping moderation.");
      return { flagged: false, reason: null };
    }
    const idToken = await user.getIdToken();

    const body: Record<string, string> = { title, description };
    if (imageBase64) {
      body.imageBase64 = imageBase64;
    }

    const response = await fetch(MODERATION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error("[moderation] Function returned status", response.status);
      return { flagged: false, reason: null };
    }

    const data: ModerationResult = await response.json();
    return data;
  } catch (err) {
    console.error("[moderation] Request failed:", err);
    return { flagged: false, reason: null };
  }
}
