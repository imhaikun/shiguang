import { useState } from "react";
import { Save, Palette, Bell, Shield, User, Lock, AlertCircle, Check } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { user, updateProfile, changePassword } = useAuth();

  const [saved, setSaved] = useState(false);
  const [saveMessage, setSaveMessage] = useState("设置已保存！");

  const [siteTitle, setSiteTitle] = useState("那斯棧");
  const [siteDescription, setSiteDescription] = useState(
    "写代码，也写生活。一个关于设计、代码与生活的个人博客。"
  );

  const [username, setUsername] = useState(user?.username ?? "admin");
  const [email, setEmail] = useState(user?.email ?? "");
  const [profileError, setProfileError] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const showSuccess = (message: string) => {
    setSaveMessage(message);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleSaveSite = () => {
    showSuccess("站点信息已保存！");
  };

  const handleSaveProfile = async () => {
    setProfileError("");
    if (!username.trim()) {
      setProfileError("用户名不能为空");
      return;
    }
    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      setProfileError("邮箱格式不正确");
      return;
    }
    const ok = await updateProfile({ username: username.trim(), email: email.trim() });
    if (ok) {
      showSuccess("个人信息已更新！");
    } else {
      setProfileError("更新失败，请稍后重试");
    }
  };

  const handleChangePassword = async () => {
    setPasswordError("");
    if (!currentPassword) {
      setPasswordError("请输入当前密码");
      return;
    }
    if (!newPassword) {
      setPasswordError("请输入新密码");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("新密码长度至少为 6 位");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("两次输入的新密码不一致");
      return;
    }
    const ok = await changePassword(currentPassword, newPassword);
    if (ok) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showSuccess("密码已修改！");
    } else {
      setPasswordError("当前密码错误");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="blog-h2" style={{ margin: 0 }}>
          设置
        </h2>
        <p className="blog-small mt-1" style={{ color: "var(--blog-muted)" }}>
          配置博客站点信息、管理员账户和偏好设置
        </p>
      </div>

      {saved && (
        <div
          className="p-4 rounded-md flex items-center gap-2"
          style={{
            background: "rgba(22,163,74,0.08)",
            border: "1px solid rgba(22,163,74,0.2)",
          }}
        >
          <Check className="h-4 w-4" style={{ color: "#16a34a" }} />
          <span className="blog-small" style={{ color: "#16a34a" }}>
            {saveMessage}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* 站点信息 */}
          <div
            className="rounded-lg p-6"
            style={{
              background: "var(--blog-card)",
              border: "1px solid var(--blog-border)",
            }}
          >
            <h3 className="blog-h3 mb-4 flex items-center gap-2" style={{ margin: 0 }}>
              <Palette className="h-5 w-5" style={{ color: "var(--blog-primary)" }} />
              站点信息
            </h3>
            <div className="space-y-4">
              <div>
                <label
                  className="block blog-small font-medium mb-2"
                  style={{ color: "var(--blog-foreground)" }}
                >
                  站点标题
                </label>
                <input
                  type="text"
                  value={siteTitle}
                  onChange={(e) => setSiteTitle(e.target.value)}
                  className="w-full rounded-md px-4 py-3 text-sm focus:outline-none transition-colors"
                  style={{
                    border: "1px solid var(--blog-border)",
                    background: "var(--blog-background)",
                    color: "var(--blog-foreground)",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--blog-ring)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--blog-border)")}
                />
              </div>
              <div>
                <label
                  className="block blog-small font-medium mb-2"
                  style={{ color: "var(--blog-foreground)" }}
                >
                  站点描述
                </label>
                <textarea
                  value={siteDescription}
                  onChange={(e) => setSiteDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-md px-4 py-3 text-sm focus:outline-none transition-colors resize-none"
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
            <div className="mt-5 flex justify-end">
              <button
                onClick={handleSaveSite}
                className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white transition-opacity hover:opacity-90"
                style={{ background: "var(--blog-primary)" }}
              >
                <Save className="h-4 w-4" />
                保存站点信息
              </button>
            </div>
          </div>

          {/* 管理员账户 */}
          <div
            className="rounded-lg p-6"
            style={{
              background: "var(--blog-card)",
              border: "1px solid var(--blog-border)",
            }}
          >
            <h3 className="blog-h3 mb-4 flex items-center gap-2" style={{ margin: 0 }}>
              <User className="h-5 w-5" style={{ color: "var(--blog-primary)" }} />
              管理员信息
            </h3>
            {profileError && (
              <div className="mb-4 p-3 rounded-md flex items-center gap-2" style={{ background: "rgba(220,38,38,0.08)" }}>
                <AlertCircle className="h-4 w-4" style={{ color: "#dc2626" }} />
                <span className="blog-small" style={{ color: "#dc2626" }}>
                  {profileError}
                </span>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  className="block blog-small font-medium mb-2"
                  style={{ color: "var(--blog-foreground)" }}
                >
                  用户名 <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-md px-4 py-3 text-sm focus:outline-none transition-colors"
                  style={{
                    border: "1px solid var(--blog-border)",
                    background: "var(--blog-background)",
                    color: "var(--blog-foreground)",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--blog-ring)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--blog-border)")}
                />
              </div>
              <div>
                <label
                  className="block blog-small font-medium mb-2"
                  style={{ color: "var(--blog-foreground)" }}
                >
                  邮箱
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@shiguang.dev"
                  className="w-full rounded-md px-4 py-3 text-sm focus:outline-none transition-colors"
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
            <div className="mt-5 flex justify-end">
              <button
                onClick={handleSaveProfile}
                className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white transition-opacity hover:opacity-90"
                style={{ background: "var(--blog-primary)" }}
              >
                <Save className="h-4 w-4" />
                更新个人信息
              </button>
            </div>
          </div>

          {/* 修改密码 */}
          <div
            className="rounded-lg p-6"
            style={{
              background: "var(--blog-card)",
              border: "1px solid var(--blog-border)",
            }}
          >
            <h3 className="blog-h3 mb-4 flex items-center gap-2" style={{ margin: 0 }}>
              <Lock className="h-5 w-5" style={{ color: "var(--blog-primary)" }} />
              修改密码
            </h3>
            {passwordError && (
              <div className="mb-4 p-3 rounded-md flex items-center gap-2" style={{ background: "rgba(220,38,38,0.08)" }}>
                <AlertCircle className="h-4 w-4" style={{ color: "#dc2626" }} />
                <span className="blog-small" style={{ color: "#dc2626" }}>
                  {passwordError}
                </span>
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label
                  className="block blog-small font-medium mb-2"
                  style={{ color: "var(--blog-foreground)" }}
                >
                  当前密码
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="请输入当前密码"
                  className="w-full rounded-md px-4 py-3 text-sm focus:outline-none transition-colors"
                  style={{
                    border: "1px solid var(--blog-border)",
                    background: "var(--blog-background)",
                    color: "var(--blog-foreground)",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--blog-ring)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--blog-border)")}
                />
              </div>
              <div>
                <label
                  className="block blog-small font-medium mb-2"
                  style={{ color: "var(--blog-foreground)" }}
                >
                  新密码
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="至少 6 位"
                  className="w-full rounded-md px-4 py-3 text-sm focus:outline-none transition-colors"
                  style={{
                    border: "1px solid var(--blog-border)",
                    background: "var(--blog-background)",
                    color: "var(--blog-foreground)",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--blog-ring)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--blog-border)")}
                />
              </div>
              <div>
                <label
                  className="block blog-small font-medium mb-2"
                  style={{ color: "var(--blog-foreground)" }}
                >
                  确认新密码
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="再次输入新密码"
                  className="w-full rounded-md px-4 py-3 text-sm focus:outline-none transition-colors"
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
            <div className="mt-5 flex justify-end">
              <button
                onClick={handleChangePassword}
                className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white transition-opacity hover:opacity-90"
                style={{ background: "var(--blog-primary)" }}
              >
                <Lock className="h-4 w-4" />
                修改密码
              </button>
            </div>
          </div>

          {/* 通知设置 */}
          <div
            className="rounded-lg p-6"
            style={{
              background: "var(--blog-card)",
              border: "1px solid var(--blog-border)",
            }}
          >
            <h3 className="blog-h3 mb-4 flex items-center gap-2" style={{ margin: 0 }}>
              <Bell className="h-5 w-5" style={{ color: "var(--blog-primary)" }} />
              通知设置
            </h3>
            <div className="space-y-4">
              <label
                className="flex items-center gap-3 cursor-pointer"
                style={{ color: "var(--blog-foreground)" }}
              >
                <input
                  type="checkbox"
                  checked={true}
                  className="w-4 h-4 rounded"
                  style={{ accentColor: "var(--blog-primary)" }}
                />
                <span className="blog-small">接收评论通知</span>
              </label>
              <label
                className="flex items-center gap-3 cursor-pointer"
                style={{ color: "var(--blog-foreground)" }}
              >
                <input
                  type="checkbox"
                  checked={false}
                  className="w-4 h-4 rounded"
                  style={{ accentColor: "var(--blog-primary)" }}
                />
                <span className="blog-small">接收订阅邮件</span>
              </label>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div
            className="rounded-lg p-6"
            style={{
              background: "var(--blog-card)",
              border: "1px solid var(--blog-border)",
            }}
          >
            <h3 className="blog-h3 mb-4 flex items-center gap-2" style={{ margin: 0 }}>
              <Shield className="h-5 w-5" style={{ color: "var(--blog-primary)" }} />
              主题模式
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => setTheme("light")}
                className="w-full flex items-center justify-between px-4 py-3 rounded-md text-sm transition-colors"
                style={{
                  background: theme === "light" ? "rgba(59,130,246,0.08)" : "var(--blog-background)",
                  border: theme === "light" ? "1px solid var(--blog-primary)" : "1px solid var(--blog-border)",
                  color: theme === "light" ? "var(--blog-primary)" : "var(--blog-muted-foreground)",
                }}
              >
                <span>亮色模式</span>
                {theme === "light" && (
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-xs"
                    style={{ background: "var(--blog-primary)", color: "#fff" }}
                  >
                    ✓
                  </span>
                )}
              </button>
              <button
                onClick={() => setTheme("dark")}
                className="w-full flex items-center justify-between px-4 py-3 rounded-md text-sm transition-colors"
                style={{
                  background: theme === "dark" ? "rgba(96,165,250,0.1)" : "var(--blog-background)",
                  border: theme === "dark" ? "1px solid var(--blog-primary)" : "1px solid var(--blog-border)",
                  color: theme === "dark" ? "var(--blog-primary)" : "var(--blog-muted-foreground)",
                }}
              >
                <span>暗色模式</span>
                {theme === "dark" && (
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-xs"
                    style={{ background: "var(--blog-primary)", color: "#fff" }}
                  >
                    ✓
                  </span>
                )}
              </button>
            </div>
          </div>

          <div
            className="rounded-lg p-6"
            style={{
              background: "var(--blog-card)",
              border: "1px solid var(--blog-border)",
            }}
          >
            <h3 className="blog-h3 mb-4" style={{ margin: 0 }}>
              安全提示
            </h3>
            <p className="blog-small" style={{ color: "var(--blog-muted-foreground)", lineHeight: 1.6 }}>
              账户信息已持久化到服务器端数据库，修改后将永久生效。清除浏览器数据后需重新登录，但账户信息会保留。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
