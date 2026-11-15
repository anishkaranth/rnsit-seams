import { useState } from "react";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { GROK_PROVIDERS, authClient, authEnabled, signIn } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Button, Field, fieldClass } from "@/components/seams/ui";

export const Route = createFileRoute("/login")({ component: LoginRoute });

function LoginRoute() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) {
    return (
      <main className="grid min-h-screen place-items-center bg-bg">
        <div className="h-8 w-40 animate-pulse rounded-md bg-surface-2" />
      </main>
    );
  }
  if (user) return <Navigate to="/desk" search={{ view: "overview", id: "" }} />;
  return <Login />;
}

function rememberPreviewToken(token: string | null) {
  if (!token || typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem("grok-auth.bearer-token", token);
  } catch {
    /* storage unavailable */
  }
}

function Login() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!authEnabled) return;
    setBusy(true);
    setError("");
    const fetchOptions = {
      onSuccess(ctx: { response: Response }) {
        rememberPreviewToken(ctx.response.headers.get("set-auth-token"));
      },
    };
    const result =
      mode === "up"
        ? await authClient.signUp.email({ name, email, password, callbackURL: "/desk", fetchOptions })
        : await authClient.signIn.email({ email, password, callbackURL: "/desk", fetchOptions });
    if (result.error) {
      setBusy(false);
      setError(result.error.message ?? "Sign-in failed.");
      return;
    }
    try {
      await authClient.getSession();
    } catch {
      /* the next navigation reloads the session */
    }
    window.location.href = "/desk";
  }

  return (
    <main className="min-h-screen bg-bg text-fg">
      <div className="mx-auto grid min-h-screen max-w-5xl lg:grid-cols-2">
        <section className="hidden border-r border-line px-10 py-12 lg:block">
          <p className="font-display text-3xl">SEAMS</p>
          <p className="mt-6 max-w-sm text-sm leading-6 text-muted">
            Student Event Participation and Achievement Management for the Department of Computer Science and
            Engineering, RNS Institute of Technology.
          </p>
        </section>
        <section className="flex items-center px-5 py-10">
          <div className="mx-auto w-full max-w-sm">
            <Link to="/" className="text-sm text-muted">
              Back
            </Link>
            <h1 className="mt-4 font-display text-4xl">{mode === "in" ? "Sign in" : "Create an account"}</h1>
            <p className="mt-2 text-sm leading-6 text-muted">
              College Google, X, or an email and password kept by this desk.
            </p>
            {authEnabled ? (
              <form onSubmit={onSubmit} className="mt-6 grid gap-3">
                {mode === "up" ? (
                  <Field label="Name">
                    <input className={fieldClass} value={name} onChange={(e) => setName(e.target.value)} required />
                  </Field>
                ) : null}
                <Field label="Email">
                  <input
                    className={fieldClass}
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </Field>
                <Field label="Password" hint="At least 8 characters.">
                  <input
                    className={fieldClass}
                    type="password"
                    autoComplete={mode === "up" ? "new-password" : "current-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={8}
                    required
                  />
                </Field>
                {error ? <p className="text-sm text-danger">{error}</p> : null}
                <Button type="submit" disabled={busy}>
                  {busy ? "Please wait…" : mode === "in" ? "Sign in" : "Create account"}
                </Button>
                <button
                  type="button"
                  className="min-h-11 text-sm text-muted"
                  onClick={() => {
                    setMode(mode === "in" ? "up" : "in");
                    setError("");
                  }}
                >
                  {mode === "in" ? "Need an account? Create one" : "Already registered? Sign in"}
                </button>
              </form>
            ) : (
              <p className="mt-6 text-sm text-muted">Sign-in is disabled.</p>
            )}
            {authEnabled ? (
              <div className="mt-6 grid gap-2 border-t border-line pt-6">
                {GROK_PROVIDERS.map((provider) => (
                  <button
                    key={provider.providerId}
                    type="button"
                    onClick={() => {
                      void signIn(provider.providerId, { callbackURL: "/desk" }).catch((err: unknown) => {
                        setError(err instanceof Error ? err.message : "Sign-in failed.");
                      });
                    }}
                    className="min-h-11 rounded-md border border-line px-4 text-sm"
                  >
                    Continue with {provider.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
