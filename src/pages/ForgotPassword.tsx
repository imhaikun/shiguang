import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Mail, Lock, ArrowLeft, AlertCircle, Check, Loader2 } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [step, setStep] = useState<1 | 2>(token ? 2 : 1);
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailDisplay, setEmailDisplay] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (token) {
      verifyToken(token);
    }
  }, [token]);

  const verifyToken = async (token: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/forgot-password/verify-token?token=${token}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setEmailDisplay(data.email);
        setStep(2);
      } else {
        setError(data.message || "重置链接已过期或无效");
        setStep(1);
      }
    } catch {
      setError("验证链接失败，请重新获取");
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const showError = (msg: string) => {
    setError(msg);
    setSuccess("");
  };

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setError("");
  };

  const startCountdown = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendLink = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim()) {
      showError("请输入邮箱地址");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      showError("邮箱格式不正确");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(API_BASE + "/api/auth/forgot-password/send-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "发送失败");
      }
      showSuccess(data.message);
      startCountdown();
    } catch (err) {
      showError(err instanceof Error ? err.message : "发送失败");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!newPassword) {
      showError("请输入新密码");
      return;
    }
    if (newPassword.length < 6) {
      showError("新密码长度至少为 6 位");
      return;
    }
    if (newPassword !== confirmPassword) {
      showError("两次输入的密码不一致");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(API_BASE + "/api/auth/forgot-password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "重置失败");
      }
      showSuccess("密码重置成功，即将跳转到登录页");
      setTimeout(() => navigate("/admin/login"), 1500);
    } catch (err) {
      showError(err instanceof Error ? err.message : "重置失败");
    } finally {
      setLoading(false);
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
            className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, var(--blog-primary), #93c5fd)",
            }}
          >
            <svg
              className="h-8 w-10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
            >
              <rect x="2" y="2" width="20" height="18" rx="5" strokeWidth="2"/>
              <line x1="7" y1="20" x2="7" y2="24" strokeWidth="2" strokeLinecap="round"/>
              <line x1="17" y1="20" x2="17" y2="24" strokeWidth="2" strokeLinecap="round"/>
              <line x1="8" y1="5" x2="8" y2="17" strokeWidth="1.5"/>
              <line x1="13" y1="5" x2="13" y2="17" strokeWidth="1.5"/>
              <line x1="18" y1="5" x2="18" y2="17" strokeWidth="1.5"/>
              <circle cx="5" cy="15" r="1.5" fill="white" stroke="none"/>
              <circle cx="10.5" cy="7" r="1.5" fill="white" stroke="none"/>
              <circle cx="15.5" cy="7" r="1.5" fill="white" stroke="none"/>
            </svg>
          </div>
          <h1 className="blog-h2 mb-2" style={{ fontSize: "1.5rem" }}>
            {step === 1 ? "忘记密码" : "重置密码"}
          </h1>
          <p className="blog-small" style={{ color: "var(--blog-muted)" }}>
            {step === 1 
              ? "输入管理员邮箱获取重置密码链接" 
              : `将为 ${emailDisplay} 设置新密码`
            }
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
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#dc2626" }} />
            <span className="blog-small text-sm" style={{ color: "#dc2626" }}>
              {error}
            </span>
          </div>
        )}

        {success && (
          <div
            className="mb-4 p-3 rounded-md flex items-start gap-2"
            style={{
              background: "rgba(22,163,74,0.08)",
              border: "1px solid rgba(22,163,74,0.2)",
            }}
          >
            <Check className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#16a34a" }} />
            <span className="blog-small text-sm" style={{ color: "#16a34a" }}>
              {success}
            </span>
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSendLink} className="space-y-4">
            <div>
              <label className="block blog-small font-medium mb-2" style={{ color: "var(--blog-foreground)" }}>
                邮箱地址
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--blog-muted)" }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@shiguang.dev"
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
              disabled={loading || countdown > 0}
              className="w-full py-3 rounded-md text-sm font-medium text-white transition-opacity disabled:opacity-70"
              style={{ background: "var(--blog-primary)" }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  发送中...
                </span>
              ) : countdown > 0 ? (
                `${countdown} 秒后重试`
              ) : (
                "获取重置密码链接"
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--blog-primary)" }} />
              </div>
            )}
            {!loading && (
              <>
                <div>
                  <label className="block blog-small font-medium mb-2" style={{ color: "var(--blog-foreground)" }}>
                    新密码
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--blog-muted)" }} />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="至少 6 位"
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
                  <label className="block blog-small font-medium mb-2" style={{ color: "var(--blog-foreground)" }}>
                    确认新密码
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--blog-muted)" }} />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="再次输入新密码"
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
                      重置中...
                    </span>
                  ) : (
                    "重置密码"
                  )}
                </button>
              </>
            )}
          </form>
        )}

        <p className="mt-6 text-center">
          <Link
            to="/admin/login"
            className="inline-flex items-center gap-1 blog-caption no-underline transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            返回登录页
          </Link>
        </p>
      </div>
    </div>
  );
}