import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, KeyRound, ArrowLeft, AlertCircle, Check, Loader2 } from "lucide-react";

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

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

  const handleSendCode = async (e?: React.FormEvent) => {
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
      const res = await fetch("/api/auth/forgot-password/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "发送失败");
      }
      showSuccess("验证码已发送，请查收邮件");
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

    if (!code.trim()) {
      showError("请输入验证码");
      return;
    }
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
      const res = await fetch("/api/auth/forgot-password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code: code.trim(), newPassword }),
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
            className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-white font-display text-2xl font-semibold"
            style={{
              background: "linear-gradient(135deg, var(--blog-primary), #93c5fd)",
            }}
          >
            拾
          </div>
          <h1 className="blog-h2 mb-2" style={{ fontSize: "1.5rem" }}>
            忘记密码
          </h1>
          <p className="blog-small" style={{ color: "var(--blog-muted)" }}>
            {step === 1 ? "输入管理员邮箱获取验证码" : "输入验证码并设置新密码"}
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
          <form onSubmit={handleSendCode} className="space-y-4">
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
                "获取验证码"
              )}
            </button>

            {code && (
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full py-3 rounded-md text-sm font-medium transition-opacity hover:opacity-90"
                style={{ background: "rgba(59,130,246,0.08)", color: "var(--blog-primary)" }}
              >
                我已收到验证码
              </button>
            )}
          </form>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="block blog-small font-medium mb-2" style={{ color: "var(--blog-foreground)" }}>
                验证码
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--blog-muted)" }} />
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="6 位验证码"
                  maxLength={6}
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
            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full py-3 rounded-md text-sm font-medium transition-colors"
              style={{ color: "var(--blog-muted-foreground)" }}
            >
              返回上一步
            </button>
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
