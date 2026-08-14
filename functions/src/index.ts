import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

admin.initializeApp();

type ModerationInput = string | { type: "image_url"; image_url: { url: string } };

// Maximum base64 image size: ~5MB (plenty for a compressed photo)
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export const moderateContent = onRequest(
  {
    cors: true,
    secrets: ["OPENAI_MOD_KEY"],
    // Increase memory to handle base64 images
    memory: "512MiB",
  },
  async (req, res) => {
    // Only allow POST
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    // ── Auth check: verify the caller is a signed-in Firebase user ──
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ error: "Missing or invalid authorization header" });
      return;
    }

    const idToken = authHeader.split("Bearer ")[1];
    try {
      await admin.auth().verifyIdToken(idToken);
    } catch {
      res.status(403).json({ error: "Invalid or expired token" });
      return;
    }

    // ── Input validation ──
    const { title, description, imageBase64 } = req.body as {
      title?: string;
      description?: string;
      imageBase64?: string;
    };

    if (!title && !description && !imageBase64) {
      res.status(400).json({ error: "Nothing to moderate" });
      return;
    }

    // Reject oversized image payloads
    if (imageBase64 && imageBase64.length > MAX_IMAGE_SIZE) {
      res.status(413).json({ error: "Image too large" });
      return;
    }

    const apiKey = process.env.OPENAI_MOD_KEY;
    if (!apiKey) {
      // If no key configured, fail-open
      res.json({ flagged: false, reason: null });
      return;
    }

    try {
      // Build the input array for OpenAI's omni-moderation-latest model.
      // It supports both text and image inputs in a single request.
      const inputs: ModerationInput[] = [];

      const textContent = [title, description].filter(Boolean).join("\n\n");
      if (textContent) {
        inputs.push(textContent);
      }

      if (imageBase64) {
        inputs.push({
          type: "image_url",
          image_url: { url: imageBase64 },
        });
      }

      const response = await fetch("https://api.openai.com/v1/moderations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "omni-moderation-latest",
          input: inputs,
        }),
      });

      if (!response.ok) {
        console.error("OpenAI moderation API error:", response.status, await response.text());
        // Fail-open: don't block users if OpenAI is having issues
        res.json({ flagged: false, reason: null });
        return;
      }

      const data = await response.json();
      const result = data.results?.[0];

      if (!result || !result.flagged) {
        res.json({ flagged: false, reason: null });
        return;
      }

      // Build readable reason from flagged categories
      const flaggedCategories = Object.entries(result.categories as Record<string, boolean>)
        .filter(([, isFlagged]) => isFlagged)
        .map(([category]) => category.replace(/[/_-]/g, " "));

      res.json({
        flagged: true,
        reason: `Your report was flagged for: ${flaggedCategories.join(", ")}. Please revise the content and try again.`,
      });
    } catch (err) {
      console.error("Moderation function error:", err);
      // Fail-open
      res.json({ flagged: false, reason: null });
    }
  }
);
