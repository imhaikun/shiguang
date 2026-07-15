import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Lock, Mail, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    navigate("/admin");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const success = await login(username, password);
    setLoading(false);

    if (success) {
      navigate("/admin");
    } else {
      setError("用户名或密码错误，请使用 admin/admin");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div
        className="w-full max-w-md rounded-lg p-8"
        style={{
          background: "var(--blog-card)",
          border: "1px solid var(--blog-border)",
        }}
      >
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-white font-display text-2xl font-semibold"
            style={{
              background: "linear-gradient(135deg, var(--blog-primary), #93c5fd)",
            }}
          >
            拾
          </div>
          <h1 className="blog-h2 mb-2" style={{ fontSize: "1.5rem" }}>
            后台登录
          </h1>
          <p className="blog-small" style={{ color: "var(--blog-muted)" }}>
            请输入管理员账号密码
          </p>
        </div>

        {error && (
          <div
            className="mb-4 p-3 rounded-md flex items-start gap-2"
            style={{
              background: "rgba(220,38,38,0.08)",
              border: "1px solid rgba(220,38,38,0.2)",
            }}
          >
            <AlertCircle
              className="h-4 w-4 flex-shrink-0 mt-0.5"
              style={{ color: "#dc2626" }}
            />
            <span className="blog-small text-sm" style={{ color: "#dc2626" }}>
              {error}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              className="block blog-small font-medium mb-2"
              style={{ color: "var(--blog-foreground)" }}
            >
              用户名
            </label>
            <div className="relative">
              <Mail
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                style={{ color: "var(--blog-muted)" }}
              />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full rounded-md px-4 py-3 pl-10 text-sm focus:outline-none transition-colors"
                style={{
                  border: "1px solid var(--blog-border)",
                  background: "var(--blog-background)",
                  color: "var(--blog-foreground)",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--blog-ring)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--blog-border)")}
              />
            </div>
          </div>

          <div>
            <label
              className="block blog-small font-medium mb-2"
              style={{ color: "var(--blog-foreground)" }}
            >
              密码
            </label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                style={{ color: "var(--blog-muted)" }}
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="admin"
                className="w-full rounded-md px-4 py-3 pl-10 text-sm focus:outline-none transition-colors"
                style={{
                  border: "1px solid var(--blog-border)",
                  background: "var(--blog-background)",
                  color: "var(--blog-foreground)",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--blog-ring)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--blog-border)")}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-md text-sm font-medium text-white transition-opacity disabled:opacity-70"
            style={{ background: "var(--blog-primary)" }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                登录中...
              </span>
            ) : (
              "登录"
            )}
          </button>
        </form>

        <p className="mt-6 text-center blog-caption">
          默认账号：<span style={{ color: "var(--blog-primary)", fontWeight: 500 }}>admin</span>
          &nbsp;/&nbsp;
          <span style={{ color: "var(--blog-primary)", fontWeight: 500 }}>admin</span>
        </p>

        <div className="mt-6 flex items-center justify-center gap-4">
          <Link
            to="/admin/forgot-password"
            className="blog-caption no-underline transition-colors hover:text-primary"
          >
            忘记密码？
          </Link>
          <span style={{ color: "var(--blog-border)" }}>|</span>
          <Link
            to="/"
            className="blog-caption no-underline transition-colors hover:text-primary"
          >
            返回前台首页
          </Link>
        </div>
      </div>
    </div>
  );
}
