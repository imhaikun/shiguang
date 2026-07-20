import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Lock, Mail, AlertCircle, Loader2, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

// 生成随机验证码
function generateCaptcha(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [captchaCode, setCaptchaCode] = useState(generateCaptcha);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 绘制验证码到 Canvas
  const drawCaptcha = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // 清空背景
    ctx.fillStyle = "#f5f5f5";
    ctx.fillRect(0, 0, w, h);

    // 绘制干扰线
    for (let i = 0; i < 4; i++) {
      ctx.strokeStyle = `rgba(${Math.random() * 150}, ${Math.random() * 150}, ${Math.random() * 150}, 0.5)`;
      ctx.beginPath();
      ctx.moveTo(Math.random() * w, Math.random() * h);
      ctx.lineTo(Math.random() * w, Math.random() * h);
      ctx.stroke();
    }

    // 绘制干扰点
    for (let i = 0; i < 20; i++) {
      ctx.fillStyle = `rgba(${Math.random() * 150}, ${Math.random() * 150}, ${Math.random() * 150}, 0.6)`;
      ctx.beginPath();
      ctx.arc(Math.random() * w, Math.random() * h, 1, 0, Math.PI * 2);
      ctx.fill();
    }

    // 绘制验证码字符
    const colors = ["#1e293b", "#10b981", "#dc2626", "#2563eb", "#7c3aed", "#db2777"];
    const chars = captchaCode.split("");
    const charWidth = w / (chars.length + 1);
    chars.forEach((char, i) => {
      ctx.save();
      ctx.font = `bold ${24 + Math.random() * 6}px "Inter", "Noto Sans SC", sans-serif`;
      ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const x = charWidth * (i + 1);
      const y = h / 2 + (Math.random() - 0.5) * 8;
      ctx.translate(x, y);
      ctx.rotate((Math.random() - 0.5) * 0.5);
      ctx.fillText(char, 0, 0);
      ctx.restore();
    });
  }, [captchaCode]);

  useEffect(() => {
    drawCaptcha();
  }, [drawCaptcha]);

  const refreshCaptcha = () => {
    setCaptchaCode(generateCaptcha());
    setCaptchaInput("");
  };

  if (isAuthenticated) {
    navigate("/admin");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // 校验验证码（不区分大小写）
    if (captchaInput.toUpperCase() !== captchaCode.toUpperCase()) {
      setError("验证码错误，请重新输入");
      refreshCaptcha();
      return;
    }

    setLoading(true);

    const success = await login(username, password);
    setLoading(false);

    if (success) {
      navigate("/admin");
    } else {
      setError("用户名或密码错误，请使用 admin/admin");
      refreshCaptcha();
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

          <div>
            <label
              className="block blog-small font-medium mb-2"
              style={{ color: "var(--blog-foreground)" }}
            >
              验证码
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <ShieldCheck
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                  style={{ color: "var(--blog-muted)" }}
                />
                <input
                  type="text"
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value)}
                  placeholder="请输入验证码"
                  maxLength={4}
                  className="w-full rounded-md px-4 py-3 pl-10 text-sm focus:outline-none transition-colors uppercase"
                  style={{
                    border: "1px solid var(--blog-border)",
                    background: "var(--blog-background)",
                    color: "var(--blog-foreground)",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--blog-ring)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--blog-border)")}
                />
              </div>
              <canvas
                ref={canvasRef}
                width={120}
                height={48}
                onClick={refreshCaptcha}
                title="点击刷新验证码"
                className="rounded-md cursor-pointer flex-shrink-0"
                style={{
                  border: "1px solid var(--blog-border)",
                  background: "#f5f5f5",
                }}
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
