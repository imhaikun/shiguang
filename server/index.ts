import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import nodemailer from "nodemailer";

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "db", "users.json");

interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  role: string;
}

interface DB {
  users: User[];
}

function readDB(): DB {
  try {
    const data = fs.readFileSync(DB_PATH, "utf-8");
    return JSON.parse(data);
  } catch {
    return { users: [] };
  }
}

function writeDB(data: DB) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
}

// 验证码内存缓存（生产环境建议用 Redis）
const codeCache = new Map<string, { code: string; expireAt: number }>();
const CODE_TTL_MS = 10 * 60 * 1000; // 10 分钟

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function getTransporter() {
  const smtpHost = process.env.SMTP_HOST || "";
  const smtpPort = Number(process.env.SMTP_PORT || 587);
  const smtpUser = process.env.SMTP_USER || "";
  const smtpPass = process.env.SMTP_PASS || "";

  if (!smtpHost || !smtpUser || !smtpPass) {
    return null;
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
}

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const db = readDB();
  const user = db.users.find(u => u.username === username && u.password === password);
  if (user) {
    res.json({
      success: true,
      user: { id: user.id, username: user.username, email: user.email, role: user.role }
    });
  } else {
    res.status(401).json({ success: false, message: "用户名或密码错误" });
  }
});

app.get("/api/users/:id", (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const user = db.users.find(u => u.id === id);
  if (user) {
    res.json({
      success: true,
      user: { id: user.id, username: user.username, email: user.email, role: user.role }
    });
  } else {
    res.status(404).json({ success: false, message: "用户不存在" });
  }
});

app.put("/api/users/:id/profile", (req, res) => {
  const { id } = req.params;
  const { username, email } = req.body;
  const db = readDB();
  const index = db.users.findIndex(u => u.id === id);
  if (index !== -1) {
    db.users[index].username = username;
    db.users[index].email = email;
    writeDB(db);
    res.json({
      success: true,
      user: { id: db.users[index].id, username: db.users[index].username, email: db.users[index].email, role: db.users[index].role }
    });
  } else {
    res.status(404).json({ success: false, message: "用户不存在" });
  }
});

app.put("/api/users/:id/password", (req, res) => {
  const { id } = req.params;
  const { currentPassword, newPassword } = req.body;
  const db = readDB();
  const index = db.users.findIndex(u => u.id === id);
  if (index !== -1) {
    if (db.users[index].password === currentPassword) {
      db.users[index].password = newPassword;
      writeDB(db);
      res.json({ success: true, message: "密码修改成功" });
    } else {
      res.status(401).json({ success: false, message: "当前密码错误" });
    }
  } else {
    res.status(404).json({ success: false, message: "用户不存在" });
  }
});

// 发送验证码
app.post("/api/auth/forgot-password/send-code", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ success: false, message: "请输入邮箱地址" });
    return;
  }

  const db = readDB();
  const user = db.users.find(u => u.email === email);
  if (!user) {
    // 不暴露邮箱是否存在
    res.status(400).json({ success: false, message: "该邮箱未绑定管理员账户" });
    return;
  }

  const transporter = getTransporter();
  if (!transporter) {
    res.status(500).json({ success: false, message: "邮件服务未配置，请联系管理员" });
    return;
  }

  const code = generateCode();
  codeCache.set(email, { code, expireAt: Date.now() + CODE_TTL_MS });

  try {
    await transporter.sendMail({
      from: `"拾光笔记" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "拾光笔记 - 密码重置验证码",
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #3b82f6;">拾光笔记</h2>
          <p>您正在进行密码重置操作，验证码如下：</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #3b82f6; margin: 24px 0;">${code}</div>
          <p style="color: #666;">验证码 10 分钟内有效，请勿泄露给他人。</p>
        </div>
      `,
    });
    res.json({ success: true, message: "验证码已发送，请查收邮件" });
  } catch (err) {
    console.error("Send email failed:", err);
    res.status(500).json({ success: false, message: "验证码发送失败，请检查邮件配置" });
  }
});

// 重置密码
app.post("/api/auth/forgot-password/reset", (req, res) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) {
    res.status(400).json({ success: false, message: "参数不完整" });
    return;
  }
  if (newPassword.length < 6) {
    res.status(400).json({ success: false, message: "新密码长度至少为 6 位" });
    return;
  }

  const cached = codeCache.get(email);
  if (!cached || cached.code !== code || Date.now() > cached.expireAt) {
    res.status(400).json({ success: false, message: "验证码错误或已过期" });
    return;
  }

  const db = readDB();
  const index = db.users.findIndex(u => u.email === email);
  if (index === -1) {
    res.status(404).json({ success: false, message: "用户不存在" });
    return;
  }

  db.users[index].password = newPassword;
  writeDB(db);
  codeCache.delete(email);

  res.json({ success: true, message: "密码重置成功，请使用新密码登录" });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
