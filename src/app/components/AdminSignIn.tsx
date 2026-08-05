import { useState } from "react";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "../../lib/firebase";

type AdminSignInProps = {
  isAdmin: boolean;
};

export default function AdminSignIn({ isAdmin }: AdminSignInProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setOpen(false);
      setEmail("");
      setPassword("");
    } catch (err) {
      console.error("Admin sign-in failed:", err);
      setError("Sign-in failed. Check your email and password.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    // onAuthStateChanged in App.tsx will re-run signInAnonymously automatically,
    // so the visitor just becomes a normal anonymous user again.
  };

  if (isAdmin) {
    return (
      <button
        type="button"
        onClick={handleSignOut}
        className="text-[10px] font-mono text-muted-foreground hover:text-foreground underline"
      >
        Sign out (admin)
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-[10px] font-mono text-muted-foreground/40 hover:text-muted-foreground"
      >
        Admin
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <form
            onSubmit={handleSignIn}
            className="bg-card border border-border rounded-sm shadow-2xl w-full max-w-xs p-6 space-y-3"
          >
            <p className="text-sm font-semibold text-foreground mb-2">Admin sign-in</p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full px-3 py-2 bg-secondary border border-border rounded-sm text-sm"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-3 py-2 bg-secondary border border-border rounded-sm text-sm"
              required
            />
            {error && <p className="text-xs text-red-600">{error}</p>}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-accent text-primary text-sm font-semibold py-2 rounded-sm disabled:opacity-60"
              >
                {submitting ? "Signing in…" : "Sign in"}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 border border-border text-sm py-2 rounded-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}