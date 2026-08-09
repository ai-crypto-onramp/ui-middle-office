import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, MOCK_LOGIN_USERS } from "@/context/AuthContext";
import { loadConfig } from "@/config";
import { Button } from "@/components/Button";
import { Field, Input } from "@/components/Field";
import { useToast } from "@/context/ToastContext";

const config = loadConfig();

export default function LoginPage() {
  const { login, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ email, password });
      toast("Signed in", "success");
      navigate("/");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Login failed", "error");
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card card">
        <h1>Middle Office</h1>
        <p className="muted small">Internal compliance & operations console</p>
        <form onSubmit={submit} style={{ marginTop: "1.5rem" }}>
          <Field label="Email">
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="username" />
          </Field>
          <Field label="Password">
            <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
          </Field>
          <Button type="submit" variant="primary" disabled={loading} style={{ width: "100%", justifyContent: "center" }}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
        {config.mockAuth && (
          <div className="divider" />
        )}
        {config.mockAuth && (
          <div className="small">
            <p className="muted">Mock mode is on — quick sign-in as:</p>
            <div className="row-wrap">
              {Object.entries(MOCK_LOGIN_USERS).map(([role, u]) => (
                <Button
                  key={role}
                  size="sm"
                  onClick={() => {
                    setEmail(u.email);
                    setPassword("mock");
                  }}
                >
                  {role}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}