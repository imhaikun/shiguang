import dotenv from "dotenv";
dotenv.config();

import express from "express";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import cors from "cors";
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";
import svgCaptcha from "svg-captcha";

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "db", "users.json");
const POSTS_PATH = path.join(__dirname, "db", "posts.json");

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

// 重置密码链接缓存（生产环境建议用 Redis）
interface ResetToken {
  token: string;
  email: string;
  expireAt: number;
}
const resetTokenCache = new Map<string, ResetToken>();

// 验证码缓存（生产环境建议用 Redis）
interface CaptchaData {
  code: string;
  expireAt: number;
}
const captchaCache = new Map<string, CaptchaData>();

// 生成随机验证码
function generateCaptchaCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
const TOKEN_TTL_MS = 10 * 60 * 1000; // 10 分钟

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
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
  const { username, password, captchaKey, captchaCode } = req.body;

  const captchaData = captchaCache.get(captchaKey);
  if (!captchaData || Date.now() > captchaData.expireAt) {
    return res.status(401).json({ success: false, message: "验证码已过期，请刷新重试" });
  }

  if (captchaCode.toUpperCase() !== captchaData.code.toUpperCase()) {
    return res.status(401).json({ success: false, message: "验证码错误" });
  }

  captchaCache.delete(captchaKey);

  const db = readDB();
  const user = db.users.find(u => u.username === username);
  if (user) {
    let isPasswordValid = false;
    const isHashed = user.password.startsWith("$2a$") || user.password.startsWith("$2b$") || user.password.startsWith("$2y$");
    
    if (isHashed) {
      isPasswordValid = bcrypt.compareSync(password, user.password);
    } else {
      isPasswordValid = user.password === password;
      if (isPasswordValid) {
        const hashedPassword = bcrypt.hashSync(password, 10);
        user.password = hashedPassword;
        writeDB(db);
      }
    }
    
    if (isPasswordValid) {
      const sessionToken = generateToken();
      res.json({
        success: true,
        user: { id: user.id, username: user.username, email: user.email, role: user.role },
        token: sessionToken
      });
    } else {
      res.status(401).json({ success: false, message: "用户名或密码错误" });
    }
  } else {
    res.status(401).json({ success: false, message: "用户名或密码错误" });
  }
});

app.get("/api/captcha", (req, res) => {
  const captchaKey = crypto.randomBytes(16).toString("hex");
  const captcha = svgCaptcha.create({
    size: 4,
    ignoreChars: "0oO1lI",
    noise: 4,
    color: true,
    background: "#f5f5f5",
    width: 120,
    height: 48
  });
  
  captchaCache.set(captchaKey, {
    code: captcha.text,
    expireAt: Date.now() + 5 * 60 * 1000
  });

  res.json({
    success: true,
    captchaKey,
    svg: captcha.data
  });
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
    const isPasswordValid = bcrypt.compareSync(currentPassword, db.users[index].password);
    if (isPasswordValid) {
      const hashedPassword = bcrypt.hashSync(newPassword, 10);
      db.users[index].password = hashedPassword;
      writeDB(db);
      res.json({ success: true, message: "密码修改成功" });
    } else {
      res.status(401).json({ success: false, message: "当前密码错误" });
    }
  } else {
    res.status(404).json({ success: false, message: "用户不存在" });
  }
});

// 发送重置密码链接
app.post("/api/auth/forgot-password/send-link", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ success: false, message: "请输入邮箱地址" });
    return;
  }

  const db = readDB();
  const user = db.users.find(u => u.email === email);
  if (!user) {
    res.status(400).json({ success: false, message: "该邮箱未绑定管理员账户" });
    return;
  }

  const transporter = getTransporter();
  const token = generateToken();
  const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5174"}/admin/forgot-password/reset?token=${token}`;

  resetTokenCache.set(token, { token, email, expireAt: Date.now() + TOKEN_TTL_MS });

  if (!transporter) {
    res.json({ success: true, message: "重置链接已生成", link: resetUrl });
    return;
  }

  try {
    await transporter.sendMail({
      from: `"那斯小棧" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "那斯小棧 - 密码重置",
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #10b981;">那斯小棧</h2>
          <p>您正在进行密码重置操作，请点击下方链接设置新密码：</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 8px; margin: 24px 0;">重置密码</a>
          <p style="color: #666; font-size: 14px;">链接 10 分钟内有效，请勿泄露给他人。</p>
          <p style="color: #999; font-size: 12px; margin-top: 20px;">如果您未申请重置密码，请忽略此邮件。</p>
        </div>
      `,
    });
    res.json({ success: true, message: "重置链接已发送，请查收邮件" });
  } catch (err) {
    console.error("Send email failed:", err);
    res.json({ success: true, message: "重置链接已生成", link: resetUrl });
  }
});

// 验证重置链接
app.get("/api/auth/forgot-password/verify-token", (req, res) => {
  const { token } = req.query;
  if (!token || typeof token !== "string") {
    res.status(400).json({ success: false, message: "无效的重置链接" });
    return;
  }

  const cached = resetTokenCache.get(token);
  if (!cached || Date.now() > cached.expireAt) {
    res.status(400).json({ success: false, message: "重置链接已过期或无效" });
    return;
  }

  res.json({ success: true, email: cached.email });
});

// 重置密码
app.post("/api/auth/forgot-password/reset", (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    res.status(400).json({ success: false, message: "参数不完整" });
    return;
  }
  if (newPassword.length < 6) {
    res.status(400).json({ success: false, message: "新密码长度至少为 6 位" });
    return;
  }

  const cached = resetTokenCache.get(token);
  if (!cached || Date.now() > cached.expireAt) {
    res.status(400).json({ success: false, message: "重置链接已过期或无效" });
    return;
  }

  const db = readDB();
  const index = db.users.findIndex(u => u.email === cached.email);
  if (index === -1) {
    res.status(404).json({ success: false, message: "用户不存在" });
    return;
  }

  const hashedPassword = bcrypt.hashSync(newPassword, 10);
  db.users[index].password = hashedPassword;
  writeDB(db);
  resetTokenCache.delete(token);

  res.json({ success: true, message: "密码重置成功，请使用新密码登录" });
});

// ── 文章接口 ──

interface Post {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  content: string;
  tags: string[];
  category?: string;
  featured?: boolean;
  status?: "draft" | "published";
}

const DEFAULT_POSTS: Post[] = [
  {
    slug: "esxi-nut-ups-shutdown",
    title: "VMware ESXi 使用 NUT 实现 NAS 共享 UPS 断电自动关机",
    date: "2026-07-10",
    excerpt: "在 VMware ESXi 下安装 NUT 客户端，配合华芸 NAS 实现 UPS 断电时自动安全关机，保护数据安全。",
    tags: ["进阶实战", "教程", "ESXi", "NAS", "UPS"],
    content: `<p>家里的 NAS 和服务器共用一台 UPS，但 UPS 只有一个 USB 接口，只能连一台设备。怎么让多台设备都能在断电时自动安全关机呢？答案是 NUT（Network UPS Tools）—— 一台设备当 NUT 服务器，其他设备当客户端，通过网络监听 UPS 状态。</p><p>本文以华芸 NAS（Asustor AS6604T）作为 NUT 服务器，VMware ESXi 8.0 Update 3 作为客户端，讲解完整的配置过程。其他品牌的 NAS 和 ESXi 版本操作基本一致。</p><h2>一、准备工作</h2><h3>1.1 启用 ESXi 的 SSH 功能</h3><p>ESXi 默认关闭 SSH，需要先手动开启：</p><ol><li>进入 ESXi WEB 管理后台</li><li>点击左侧 <strong>主机</strong>，切换到 <strong>操作</strong> 菜单</li><li>找到服务选项，启用 <strong>Secure Shell (SSH)</strong> 和 <strong>ESXi Shell</strong></li></ol><h3>1.2 修改软件安装接受级别</h3><p>ESXi 默认只接受官方签名的软件包，NUT 客户端是社区维护的，需要调整安全级别：</p><ol><li>进入 <strong>管理</strong> → <strong>安全和用户</strong> 选项卡</li><li>点击左侧 <strong>接受级别</strong></li><li>将软件接受级别修改为 <strong>社区</strong></li></ol><h3>1.3 下载 NUT 客户端软件包</h3><p>下载 ESXi 平台的 NUT 客户端安装包：</p><ul><li>下载地址：<code>http://rene.margar.fr/download/1483/</code></li><li>通过 SFTP 工具（如 Xftp）将安装包上传到 ESXi 的 <code>/tmp</code> 目录</li></ul><h2>二、安装 NUT 客户端</h2><p>通过 SSH 连接到 ESXi 主机，执行以下命令：</p><pre><code>cd /tmp
tar -xzvf NutClient-ESXi-2.8.3-2.7.1.x86_64.tar
sh upsmon-install.sh</code></pre><p>安装成功后会显示如下信息：</p><pre><code>Installation Result
   Message: Operation finished successfully.
   Reboot Required: false
   VIBs Installed: Margar_bootbank_upsmon_2.8.3-2.7.1
   VIBs Removed:
   VIBs Skipped:</code></pre><h2>三、配置 NUT 客户端</h2><p>安装完成后，回到 ESXi WEB 后台进行参数配置：</p><ol><li>进入 <strong>管理</strong> → <strong>系统</strong> 选项卡</li><li>在 <strong>高级设置</strong> 中搜索 <strong>NUT</strong></li><li>一共 6 个参数，按以下说明配置</li></ol><blockquote><p>如果找不到 NUT 相关设置项，可以尝试重启 ESXi 主机后再查看。</p></blockquote><h3>参数说明</h3><table><tr><td>参数名</td><td>说明</td><td>示例值</td></tr><tr><td>UserVars.NutFinalDelay</td><td>关机前等待时间（秒）</td><td>60</td></tr><tr><td>UserVars.NutMailTo</td><td>通知邮箱（未开启邮件通知可留空）</td><td>-</td></tr><tr><td>UserVars.NutPassword</td><td>NUT 服务器密码</td><td>AdmUps1111</td></tr><tr><td>UserVars.NutSendMail</td><td>是否发送邮件通知（0=否，1=是）</td><td>0</td></tr><tr><td>UserVars.NutUpsName</td><td>UPS 服务器地址</td><td>ASUSTOR-UPS@192.168.50.15</td></tr><tr><td>UserVars.NutUser</td><td>NUT 用户名</td><td>upsadmin</td></tr></table><blockquote><p><strong>注意</strong>：<code>NutUpsName</code> 的格式是 <code>UPS名称@NAS的IP地址</code>，需要和 NUT 服务器端的配置一致。华芸 NAS 默认的 UPS 名称和密码可以在 NAS 的 UPS 设置里查到。</p></blockquote><h3>重启 NutClient 服务</h3><p>参数配置完成后，需要重启服务才能生效：</p><ol><li>进入 <strong>管理</strong> → <strong>服务</strong> 选项卡</li><li>找到 <strong>NutClient</strong> 服务</li><li>点击 <strong>重新启动</strong> 按钮</li><li>将服务设置为 <strong>随主机启动和停止</strong></li></ol><blockquote><p>以后每次修改 NUT 配置参数后，都需要重启 NutClient 服务。</p></blockquote><h2>四、配置虚拟机自动开关机</h2><p>ESXi 主机会自动关机了，但上面跑的虚拟机还不会安全关闭。需要配置虚拟机的自动启动/停止策略：</p><ol><li>进入 <strong>管理</strong> → <strong>系统</strong> 选项卡</li><li>打开左侧 <strong>自动启动</strong> 菜单</li><li>点击 <strong>编辑设置</strong>，启用自动启动功能</li><li>设置关机操作类型为 <strong>客户机关闭</strong>（需要虚拟机安装了 VMware Tools）</li></ol><p>然后在虚拟机列表中，依次点击每台需要自动开关机的虚拟机，选择 <strong>启用</strong>。</p><blockquote><p><strong>前提条件</strong>：虚拟机必须安装 VMware Tools，否则无法实现软关机，只能强制断电。</p></blockquote><h2>五、验证配置</h2><h3>5.1 验证 UPS 连接</h3><p>在 ESXi SSH 中执行以下命令，查看能否正常获取 UPS 状态：</p><pre><code>/opt/nut/bin/upsc ASUSTOR-UPS@192.168.50.15</code></pre><p>把 IP 换成你 NAS 的地址。如果能输出 UPS 的详细信息（电池电压、负载、状态等），说明连接正常。</p><h3>5.2 验证防火墙规则</h3><p>确认 NUT 相关的防火墙规则已启用：</p><pre><code>esxcli network firewall ruleset list</code></pre><p>在输出中找到 <code>NutServer</code>，状态应为 <code>true</code>。</p><h3>5.3 实际断电测试</h3><p>最后一步，也是最关键的一步——实际拔掉 UPS 的电源插头，测试 NAS 和 ESXi 是否会按顺序自动安全关机。</p><blockquote><p><strong>建议</strong>：第一次测试前，确保所有重要数据都已保存，虚拟机里没有正在运行的重要任务。</p></blockquote><h2>注意事项</h2><ul><li>UPS 容量要足够支撑所有设备正常关机的时间</li><li>关机延迟时间（NutFinalDelay）建议设置在 60 秒以上，给 NAS 和虚拟机留够关机时间</li><li>定期测试 UPS 电池健康状态，避免关键时刻掉链子</li><li>ESXi 升级后可能需要重新安装 NUT 客户端 VIB</li></ul>`,
  },
  {
    slug: "bitlocker-encryption-in-progress",
    title: "解决 BitLocker 加密进行中：重启后分区出现加密锁",
    date: "2026-07-08",
    excerpt: "电脑重启后突然发现磁盘分区多了一把小锁？BitLocker 莫名其妙开始加密？本文教你如何查看状态并关闭加密。",
    tags: ["踩坑实录", "Windows", "BitLocker"],
    content: `<p>某天重启电脑后，突然发现某个磁盘分区上出现了一把小锁图标，显示"加密进行中"。明明没有手动开启 BitLocker，怎么就自动加密了呢？</p><p>别慌，这通常是因为设备加密（Device Encryption）被自动触发了。本文教你如何查看加密状态并关闭 BitLocker 加密。</p><h2>问题现象</h2><p>在"此电脑"中可以看到磁盘分区图标上有一个锁的标志，鼠标悬停显示"BitLocker 加密进行中"。</p><h2>一、查看加密状态</h2><p>首先以管理员身份打开命令提示符（CMD）或 PowerShell，执行以下命令查看所有分区的 BitLocker 状态：</p><pre><code>manage-bde -status</code></pre><p>这个命令会列出所有分区的加密状态，包括：加密百分比、加密方法、保护状态等信息。</p><h2>二、关闭 BitLocker 加密</h2><p>如果确定不需要 BitLocker 加密，可以执行以下命令关闭。以 C 盘为例：</p><pre><code>manage-bde -off c:</code></pre><blockquote><p>把 <code>c:</code> 替换为你要解密的分区盘符。</p></blockquote><p>执行命令后，系统会开始解密过程，这个过程可能需要一些时间，具体取决于磁盘大小和数据量。解密过程中电脑可以正常使用，但速度可能会稍慢。</p><p>可以再次使用 <code>manage-bde -status</code> 命令查看解密进度。</p><h2>三、为什么会自动加密？</h2><p>如果你确认自己没有手动开启 BitLocker，但它却自动加密了，通常有以下几种原因：</p><h3>1. 设备加密（Device Encryption）</h3><p>Windows 10/11 的家庭版和专业版都有一个"设备加密"功能，当满足以下条件时会自动启用：</p><ul><li>电脑支持 Modern Standby（现代待机）</li><li>有 TPM 2.0 芯片</li><li>使用微软账户登录</li></ul><p>这是微软的默认安全策略，很多人不知不觉中就被加密了。</p><h3>2. 新买的品牌机</h3><p>很多品牌的笔记本电脑出厂时就默认开启了 BitLocker 设备加密，第一次开机联网后自动激活。</p><h3>3. Windows 更新触发</h3><p>某些 Windows 功能更新可能会触发设备加密的自动启用。</p><h2>四、关闭设备加密（从根源解决）</h2><p>如果不想让 BitLocker 自动开启，可以关闭设备加密功能：</p><ol><li>打开 <strong>设置</strong> → <strong>隐私和安全性</strong> → <strong>设备加密</strong></li><li>将设备加密的开关关闭</li></ol><blockquote><p>注意：只有用管理员账户登录才能修改这个设置。</p></blockquote><h2>注意事项</h2><ul><li><strong>解密过程不要中断</strong>：解密时不要重启电脑、不要断电，否则可能导致数据损坏</li><li><strong>备份恢复密钥</strong>：如果以后还想用 BitLocker，一定要保存好恢复密钥，可以存到微软账户或打印出来</li><li><strong>确认数据安全</strong>：解密前确保重要数据已有备份，以防万一</li></ul>`,
  },
  {
    slug: "v2raya-cannot-start-fix",
    title: "v2rayA 无法启动？WEBUI 空白一片的排查与解决",
    date: "2026-07-05",
    excerpt: "打开 v2rayA 的 WEBUI 一片空白，一直显示检测中？本文从日志分析入手，详解两种常见原因及解决方法。",
    tags: ["踩坑实录", "v2rayA", "v2ray", "Linux"],
    content: `<p>安装完 v2rayA 后，打开 WEBUI 却是一片空白，一直转圈显示"检测中"？别着急，90% 的情况都是 v2ray 内核出了问题。本文带你从查看日志入手，一步步排查和解决。</p><h2>问题现象</h2><p>打开 v2rayA 的 WEBUI 界面（默认端口 2017），页面一片空白，显示"检测中"，无法进入管理界面。</p><h2>一、查看后台日志</h2><p>首先 SSH 到服务器，查看 v2ray 和 v2rayA 的运行状态：</p><pre><code>systemctl status v2raya v2ray</code></pre><p>如果发现 v2ray 服务启动失败，再进一步查看详细日志：</p><pre><code>journalctl -u v2ray</code></pre><h2>二、常见原因一：缺少配置文件</h2><p>最常见的错误是 v2ray 找不到配置文件，日志中会出现类似这样的报错：</p><pre><code>ExecStart=/usr/bin/v2ray run -config /etc/v2ray/config.json (code=exited, status=1/FAILURE)</code></pre><p>原因是 <code>/etc/v2ray</code> 目录不存在，或者目录下没有 <code>config.json</code> 配置文件。</p><h3>解决方法</h3><p>手动下载 v2ray 的完整发行包，解压到 <code>/etc/v2ray</code> 目录下。</p><h4>步骤 1：下载 v2ray 安装包</h4><p>以 v5.37.0 版本为例（请根据实际情况选择版本）：</p><pre><code>wget https://github.com/v2fly/v2ray-core/releases/download/v5.38.0/v2ray-linux-64.zip</code></pre><blockquote><p>如果服务器访问 GitHub 慢，可以找个镜像源下载。</p></blockquote><h4>步骤 2：解压到 /etc/v2ray 目录</h4><pre><code>mkdir -p /etc/v2ray
unzip v2ray-linux-64.zip -d /etc/v2ray</code></pre><h4>步骤 3：复制 dat 文件到 v2rayA 目录</h4><pre><code>cp /etc/v2ray/*.dat /etc/v2raya</code></pre><h4>步骤 4：重启服务</h4><pre><code>systemctl restart v2ray v2raya</code></pre><p>重启后再查看状态，v2ray 应该就能正常启动了，WEBUI 也能正常打开。</p><h2>三、常见原因二：数据库损坏</h2><p>如果 v2ray 服务是正常的，但 WEBUI 还是空白，可能是 v2rayA 的数据库文件损坏了。</p><h3>解决方法</h3><p>删除损坏的数据库文件，让 v2rayA 重建：</p><pre><code>cd /etc/v2raya
rm -f bolt.db boltv4.db
systemctl restart v2raya</code></pre><blockquote><p><strong>注意</strong>：删除数据库会丢失所有配置（节点、订阅、规则等），需要重新导入。如果有备份的话可以先备份一下。</p></blockquote><h2>四、验证</h2><p>修复完成后，打开浏览器访问 <code>http://服务器IP:2017</code>，如果能正常显示登录/管理界面，说明问题已解决。</p><h2>排查思路总结</h2><p>遇到 v2rayA 无法启动的问题，按以下顺序排查：</p><ol><li>先看 <code>systemctl status</code>，确定是哪个服务有问题</li><li>再用 <code>journalctl</code> 看具体报错信息</li><li>根据错误信息针对性解决</li><li>如果服务正常但页面有问题，考虑清理浏览器缓存或换个浏览器试试</li></ol>`,
  },
  {
    slug: "debian13-v2raya-install",
    title: "Debian 13 安装和使用 v2rayA 完整教程",
    date: "2026-07-03",
    excerpt: "从零开始在 Debian 13 (Trixie) 上安装 v2rayA，包括软件源安装、手动安装、启动服务和基础配置全流程。",
    tags: ["入门指南", "教程", "Debian", "Debian 13", "v2rayA"],
    content: `<p>v2rayA 是一个基于 V2Ray 内核的 Web 管理客户端，界面简洁、功能强大，支持 Linux 平台。本文详细介绍在 Debian 13 (Trixie) 系统上安装和使用 v2rayA 的完整步骤。</p><h2>一、安装前的说明</h2><p>v2rayA 的功能依赖于 V2Ray 内核，所以需要同时安装内核和 v2rayA 前端。推荐使用官方软件源安装，方便后续更新。</p><h2>二、方法一：通过软件源安装（推荐）</h2><h3>2.1 添加公钥</h3><p>先添加 v2rayA 软件源的 GPG 公钥：</p><pre><code>wget -qO - https://apt.v2raya.org/key/public-key.asc | sudo tee /etc/apt/keyrings/v2raya.asc</code></pre><h3>2.2 添加软件源</h3><p>将 v2rayA 软件源添加到系统源列表中：</p><pre><code>echo "deb [signed-by=/etc/apt/keyrings/v2raya.asc] https://apt.v2raya.org/ v2raya main" | sudo tee /etc/apt/sources.list.d/v2raya.list</code></pre><h3>2.3 安装 v2rayA</h3><p>更新软件源并安装：</p><pre><code>sudo apt update          # 更新软件源
sudo apt install v2raya v2ray   # 安装 v2rayA 和 V2Ray 内核</code></pre><blockquote><p>也可以安装 xray 内核替代 v2ray：<code>sudo apt install v2raya xray</code></p></blockquote><h2>三、方法二：手动安装 deb 包</h2><p>如果软件源安装失败，也可以手动下载 deb 包安装：</p><ol><li>从 GitHub Release 页面下载 v2rayA 的 deb 安装包</li><li>使用以下命令安装：</li></ol><pre><code>sudo apt install /path/to/installer_debian_xxx_vxxx.deb</code></pre><p>把路径替换为你下载的 deb 包的实际路径。V2Ray/Xray 的 deb 包也可以在官方 APT 源中找到。</p><h2>四、启动服务</h2><p>从 v2rayA 1.5 版本开始，安装后不会自动启动服务，需要手动启动并设置开机自启。</p><h3>4.1 启动 v2rayA</h3><pre><code>sudo systemctl start v2raya.service</code></pre><h3>4.2 设置开机自动启动</h3><pre><code>sudo systemctl enable v2raya.service</code></pre><h3>4.3 查看运行状态</h3><pre><code>sudo systemctl status v2raya.service</code></pre><p>看到 <code>active (running)</code> 就说明启动成功了。</p><h2>五、配置 v2rayA</h2><h3>5.1 打开管理界面</h3><p>用浏览器打开以下地址（把 IP 换成你服务器的 IP）：</p><pre><code>http://服务器IP:2017</code></pre><p>v2rayA 默认监听 2017 端口。如果是本机安装，直接访问 <code>http://localhost:2017</code> 即可。</p><h3>5.2 创建管理员账号</h3><p>首次访问需要创建管理员账号，设置用户名和密码。</p><h3>5.3 导入节点</h3><p>进入管理界面后：</p><ol><li>点击左侧的 <strong>节点</strong> 或 <strong>订阅</strong></li><li>可以手动创建节点，也可以导入订阅链接</li><li>推荐使用订阅，方便批量管理和更新</li></ol><h3>5.4 选择节点并连接</h3><p>在节点列表中选择一个节点，点击右上角的 <strong>启动</strong> 按钮即可开始使用。</p><h2>六、常见设置</h2><h3>6.1 系统代理</h3><p>v2rayA 默认开启透明代理，系统全局流量都会走代理。可以在设置中调整代理模式：</p><ul><li><strong>全局</strong>：所有流量都走代理</li><li><strong>绕过大陆</strong>：国内网站直连，国外网站走代理</li><li><strong>直连</strong>：不使用代理</li></ul><h3>6.2 端口设置</h3><p>默认端口配置：</p><ul><li>HTTP 代理：20171</li><li>SOCKS5 代理：20170</li><li>管理界面：2017</li></ul><p>可以在设置中根据需要修改。</p><h2>七、安全建议</h2><ul><li>如果服务器在公网上，建议给 v2rayA 管理界面加上访问密码</li><li>可以用防火墙限制 2017 端口的访问 IP，只允许可信 IP 访问</li><li>定期更新 v2rayA 和 V2Ray 内核版本</li></ul>`,
  },
  {
    slug: "debian13-resolv-conf-immutable",
    title: "Debian 13 无法修改 /etc/resolv.conf？文件被锁定的解决方法",
    date: "2026-07-01",
    excerpt: "Debian 13 修改 DNS 配置时，/etc/resolv.conf 即使有 root 权限也改不了？原来是文件被加上了 i 属性。",
    tags: ["踩坑实录", "Debian", "Debian 13", "DNS", "Linux"],
    content: `<p>在 Debian 13 上配置 DNS，编辑 <code>/etc/resolv.conf</code> 时发现一个奇怪的问题——明明是 root 用户，却保存不了，提示文件只读。这是怎么回事呢？</p><p>答案是：文件被设置了不可修改属性（immutable），即使用户是 root 也不能直接改。</p><h2>问题现象</h2><p>用 root 权限编辑 <code>/etc/resolv.conf</code>，保存时提示文件只读，无法修改。用 <code>ls -l</code> 看文件权限也是正常的，owner 就是 root。</p><h2>一、查看文件属性</h2><p>Linux 的文件除了普通的 rwx 权限外，还有一些特殊属性，用 <code>lsattr</code> 命令查看：</p><pre><code>lsattr /etc/resolv.conf</code></pre><p>如果输出中有一个 <code>i</code> 字母，说明文件被设置了 immutable（不可修改）属性，这种状态下：</p><ul><li>不能修改文件内容</li><li>不能删除文件</li><li>不能重命名文件</li><li>不能创建硬链接</li></ul><p>即便是 root 用户也不行，这是一种比普通权限更高的保护机制。</p><h2>二、解除文件锁定</h2><p>使用 <code>chattr</code> 命令移除 <code>i</code> 属性：</p><pre><code>chattr -i /etc/resolv.conf</code></pre><p>再用 <code>lsattr</code> 查看，确认 <code>i</code> 属性已经消失：</p><pre><code>lsattr /etc/resolv.conf</code></pre><p>没有 <code>i</code> 了，就可以正常编辑了。</p><h2>三、修改并保存 DNS 配置</h2><p>现在就可以正常编辑 <code>/etc/resolv.conf</code> 了，比如：</p><pre><code>nano /etc/resolv.conf</code></pre><p>添加或修改 DNS 服务器：</p><pre><code>nameserver 8.8.8.8
nameserver 1.1.1.1</code></pre><p>保存退出即可。</p><h2>四、为什么会有 i 属性？</h2><p>Debian 13 中 <code>/etc/resolv.conf</code> 默认就带有 <code>i</code> 属性，主要是为了防止被意外修改。在现代 Linux 系统中，DNS 配置通常由 NetworkManager、systemd-resolved 等服务统一管理，直接手动改 <code>resolv.conf</code> 不是推荐的做法。</p><h2>五、推荐的 DNS 配置方式</h2><p>与其直接改 <code>resolv.conf</code>，更推荐通过系统的网络管理工具来配置 DNS：</p><h3>方式一：使用 systemd-resolved</h3><p>编辑 <code>/etc/systemd/resolved.conf</code>：</p><pre><code>[Resolve]
DNS=8.8.8.8 1.1.1.1
FallbackDNS=223.5.5.5</code></pre><p>然后重启服务：</p><pre><code>systemctl restart systemd-resolved</code></pre><h3>方式二：在网卡配置中设置</h3><p>如果是静态 IP，可以在 <code>/etc/network/interfaces</code> 或 NetworkManager 的配置中设置 DNS。</p><h2>补充：chattr 常用属性</h2><p>除了 <code>i</code> 属性，<code>chattr</code> 还有一些常用的属性：</p><table><tr><td>属性</td><td>作用</td></tr><tr><td>a</td><td>只能追加（append），不能修改和删除已有内容</td></tr><tr><td>i</td><td>完全不可修改（immutable）</td></tr><tr><td>s</td><td>删除时安全清除数据（secure deletion）</td></tr><tr><td>u</td><td>删除后可以恢复（undeletable）</td></tr></table><blockquote><p><code>chattr +i</code> 添加属性，<code>chattr -i</code> 移除属性。</p></blockquote>`,
  },
  {
    slug: "debian12-upgrade-to-debian13",
    title: "从 Debian 12 升级到 Debian 13 (Trixie) 详细教程",
    date: "2026-06-28",
    excerpt: "一步步带你从 Debian 12 (Bookworm) 安全升级到 Debian 13 (Trixie)，包含准备工作、软件源修改、升级执行和验证全流程。",
    tags: ["入门指南", "教程", "Debian", "Debian 12", "Debian 13", "系统升级"],
    content: `<p>Debian 13 (代号 Trixie) 已经发布，想体验新版本又不想重装系统？本文带你一步步完成从 Debian 12 (Bookworm) 到 Debian 13 的原地升级。</p><blockquote><p><strong>重要提示</strong>：升级有风险，请务必备份重要数据！建议在生产环境升级前先在测试环境验证。</p></blockquote><h2>一、准备工作</h2><h3>1.1 备份重要数据</h3><p>升级前先备份关键数据（如 <code>/home</code> 目录、配置文件、数据库等），可以用 <code>rsync</code>、<code>tar</code> 或外部存储设备：</p><pre><code># 示例：备份 /home 目录到外部硬盘
rsync -av /home /path/to/external/drive/</code></pre><h3>1.2 更新当前系统到最新</h3><p>先确保当前的 Debian 12 系统是最新状态，减少升级时的问题：</p><pre><code># 更新包列表
apt update

# 升级已安装的软件包
apt upgrade -y

# 处理依赖并完整升级（确保系统完整性）
apt full-upgrade -y

# 清理无用的软件包
apt autoremove -y
apt autoclean</code></pre><h3>1.3 关闭不必要的服务</h3><p>升级过程中建议关闭非必要服务（如 Web 服务器、数据库等），减少升级过程中的冲突风险：</p><pre><code># 示例：关闭 Caddy 服务
systemctl stop caddy</code></pre><h2>二、修改软件源配置</h2><p>Debian 12 的代号是 <code>bookworm</code>，Debian 13 的代号是 <code>trixie</code>。需要把软件源里所有的 <code>bookworm</code> 替换成 <code>trixie</code>。</p><h3>2.1 编辑主源列表</h3><p>使用 nano 编辑器修改主源文件：</p><pre><code>nano /etc/apt/sources.list</code></pre><p>将文件中所有的 <code>bookworm</code> 替换为 <code>trixie</code>。示例：</p><pre><code>deb http://deb.debian.org/debian trixie main contrib non-free non-free-firmware
deb http://deb.debian.org/debian trixie-updates main contrib non-free non-free-firmware
deb http://security.debian.org/debian-security trixie-security main contrib non-free non-free-firmware</code></pre><h3>2.2 处理第三方源</h3><p>检查 <code>/etc/apt/sources.list.d/</code> 目录下的第三方源（如 Docker、Docker 等）：</p><pre><code>ls /etc/apt/sources.list.d/</code></pre><p>对于每个第三方源，需要确认它是否已经支持 Debian 13。如果不确定，建议先注释掉或暂时移除，等升级完成后再处理。</p><blockquote><p><strong>警告</strong>：不兼容的第三方源可能导致升级失败，甚至系统损坏。不确定的话宁可先禁用。</p></blockquote><h2>三、执行系统升级</h2><h3>3.1 更新包索引</h3><p>修改完软件源后，先更新一下包列表，让系统识别 Debian 13 的软件包：</p><pre><code>apt update</code></pre><p>如果有报错，根据错误信息排查。常见的是 GPG  key 过期或第三方源不兼容。</p><h3>3.2 执行最小升级</h3><p>先执行一次最小升级，只升级那些不会导致软件包被删除的包：</p><pre><code>apt upgrade -y</code></pre><blockquote><p>这一步很重要，可以避免直接 full-upgrade 时一次性处理太多依赖变化导致的问题。</p></blockquote><h3>3.3 执行完整升级</h3><p>然后执行完整的系统升级：</p><pre><code>apt full-upgrade -y</code></pre><p><code>full-upgrade</code> 会处理依赖关系的变化，包括移除过时的包、安装新的依赖包等，这是真正的系统版本升级。</p><h3>3.4 处理配置文件冲突</h3><p>升级过程中可能会出现配置文件替换的提示，常见选项：</p><ul><li><strong>N / O</strong>：保留当前配置（推荐，除非你明确需要新版本配置）</li><li><strong>Y / I</strong>：替换为新版本的配置（自定义设置会丢失）</li><li><strong>D</strong>：显示新旧配置的差异</li><li><strong>Z</strong>：打开 shell 手动处理</li></ul><blockquote><p>一般建议选 N，保留自己的配置。等升级完成后再根据需要手动调整。</p></blockquote><h2>四、完成升级并验证</h2><h3>4.1 重启系统</h3><p>升级完成后，必须重启系统以应用新内核和关键组件更新：</p><pre><code>reboot</code></pre><h3>4.2 验证系统版本</h3><p>重启后登录系统，检查是否成功升级到 Debian 13：</p><pre><code># 方法一：查看版本文件
cat /etc/debian_version

# 方法二：使用 lsb_release
lsb_release -a</code></pre><p>如果输出中包含 <code>13</code> 或 <code>trixie</code>，就说明升级成功了。</p><h3>4.3 后续清理</h3><p>确认系统正常运行后，可以清理一下旧的软件包：</p><pre><code>apt autoremove -y
apt autoclean</code></pre><h2>五、常见问题</h2><h3>升级失败开不了机怎么办？</h3><p>如果升级过程中断电或出错导致系统无法启动，可以用安装 U 盘进入救援模式，尝试修复。</p><h3>第三方软件不兼容？</h3><p>部分软件可能暂时不支持 Debian 13，建议等官方更新后再安装，或者用 Docker 容器运行旧版本。</p><h3>升级后网络不通？</h3><p>检查网卡名称是否变化（Debian 升级有时会改变网卡命名规则），查看 <code>/etc/network/interfaces</code> 或 NetworkManager 配置。</p>`,
  },
  {
    slug: "asustor-nas-ipv6-eui64",
    title: "华硕 NAS IPv6 后缀设置为 EUI-64：解决防火墙无法配置的问题",
    date: "2026-06-25",
    excerpt: "华芸 NAS 升级后 IPv6 地址生成方式变了，导致路由器防火墙规则失效？通过修改内核参数改回 EUI-64 格式。",
    tags: ["踩坑实录", "NAS", "华硕", "IPv6", "EUI64"],
    content: `<p>升级华硕 NAS 的 ADM 系统后，突然发现 IPv6 的端口映射用不了了。排查了一圈才发现，原来是 NAS 的 IPv6 地址后缀变了——从之前的 EUI-64 格式变成了随机生成的隐私地址。</p><p>路由器上的防火墙规则是按固定的 IPv6 后缀写的，地址一变，规则自然就失效了。</p><h2>问题背景</h2><p>华硕 NAS 在 ADM 4.2.6.RPI1（2024-01-22）版本中，修改了 IPv6 地址的生成机制，从原来的 EUI-64 方式改为了隐私地址（Privacy Extensions），目的是增强 IPv6 地址的隐私性和安全性。</p><p>但对于需要在路由器上配置 IPv6 防火墙或端口转发的用户来说，这就麻烦了——地址后缀不再固定，每次重启或重新连接网络后都可能变化。</p><h2>解决方案</h2><p>通过修改内核参数，将 IPv6 地址生成模式改回 EUI-64 方式，让 IPv6 后缀固定下来。</p><h3>方法一：直接修改内核参数（立即生效）</h3><p>SSH 登录到 NAS，切换到 root 用户后，执行以下命令：</p><pre><code>sysctl -w net.ipv6.conf.eth0.addr_gen_mode=0
sysctl -w net.ipv6.conf.eth1.addr_gen_mode=0</code></pre><p>如果你的 NAS 有更多网口，对应修改 <code>eth2</code>、<code>eth3</code> 等。</p><blockquote><p><code>addr_gen_mode = 0</code> 表示使用 EUI-64 方式生成 IPv6 地址，这样地址后缀是基于 MAC 地址计算的，固定不变。</p></blockquote><p>这种方法的优点是<strong>立即生效</strong>，不需要重启。但缺点是<strong>重启设备后会还原</strong>。</p><h3>方法二：写入配置文件（永久生效）</h3><p>如果希望重启后依然有效，需要将配置写入 <code>/etc/sysctl.conf</code> 文件：</p><pre><code>echo "net.ipv6.conf.eth0.addr_gen_mode = 0" >> /etc/sysctl.conf
echo "net.ipv6.conf.eth1.addr_gen_mode = 0" >> /etc/sysctl.conf</code></pre><p>然后执行以下命令让配置立即生效：</p><pre><code>sysctl -p</code></pre><blockquote><p><strong>注意</strong>：华硕 NAS 的系统文件可能会在升级 ADM 时被覆盖，升级后建议检查一下配置是否还在。</p></blockquote><h3>方法三：开机脚本自动执行</h3><p>如果担心系统升级后配置丢失，也可以写一个开机自动执行的脚本，每次启动时设置一次。</p><p>创建脚本文件，比如 <code>/usr/local/bin/ipv6-eui64.sh</code>：</p><pre><code>#!/bin/sh
sysctl -w net.ipv6.conf.eth0.addr_gen_mode=0
sysctl -w net.ipv6.conf.eth1.addr_gen_mode=0</code></pre><p>然后加入开机启动项（具体方式取决于你的 NAS 系统）。</p><h2>验证是否生效</h2><p>修改后，重新获取 IPv6 地址（断开重连网络，或重启 NAS），然后查看 IPv6 地址：</p><pre><code>ifconfig eth0
# 或
ip addr show eth0</code></pre><p>观察 IPv6 地址的后半部分（后缀），如果是基于 MAC 地址的 EUI-64 格式（通常包含 <code>ff:fe</code>），说明设置成功。</p><h2>什么是 EUI-64？</h2><p>EUI-64（Extended Unique Identifier 64-bit）是一种根据网卡 MAC 地址生成 IPv6 接口标识的标准方法：</p><ul><li>MAC 地址是 48 位，EUI-64 是 64 位</li><li>在 MAC 地址的第 3 字节和第 4 字节之间插入 <code>ff:fe</code></li><li>然后将第 7 位（U/L 位）取反</li></ul><p>这样生成的 IPv6 后缀是固定的，只要 MAC 地址不变，后缀就不变。</p><h2>注意事项</h2><ul><li>使用 EUI-64 地址的隐私性较差，因为 MAC 地址是固定的，容易被跟踪</li><li>如果只是家用 NAS，固定地址带来的便利性远大于隐私风险</li><li>如果是移动设备（笔记本、手机），建议使用隐私地址</li><li>修改前建议记录一下原来的配置，以便出问题时恢复</li></ul><h2>参考资料</h2><ul><li>Linux 内核文档关于 IPv6 addr_gen_mode 的说明</li><li>华芸 NAS 官方社区的相关讨论</li></ul>`,
  },
  {
    slug: "dpkg-error-code-1-fix",
    title: "解决 /usr/bin/dpkg returned an error code (1) 错误的方法",
    date: "2026-07-17",
    excerpt: "Debian/Ubuntu 系统 apt upgrade 时遇到 dpkg 返回错误码 1？本文教你快速修复 dpkg 状态数据库损坏问题。",
    tags: ["踩坑实录", "Linux", "apt", "Ubuntu", "Debian"],
    content: `<p>在 Debian/Ubuntu 系统中使用 <code>apt upgrade -y</code> 或 <code>apt install</code> 安装/升级软件包时，可能会遇到 dpkg 返回错误码 1 的问题。本文详细介绍错误原因和修复方法。</p><h2>问题描述</h2><p>在执行系统更新或软件安装时，出现如下错误提示：</p><pre><code>Error: Sub-process /usr/bin/dpkg returned an error code (1)</code></pre><p>这个错误通常是由于 dpkg 的状态数据库损坏，或软件包安装过程意外中断导致的。</p><p><img src="/static/img/4ce1a1f7702d6ea6fd49f8cb530bb40e.62079de7-488b-463e-b70c-696fa2689369.webp" alt="错误截图"></p><h2>彻底修复方法</h2><p>如果常规方法无效，可以通过重建 dpkg 的 info 目录来彻底解决：</p><h3>步骤 1：进入 dpkg 目录</h3><p>首先切换到 dpkg 的数据目录：</p><pre><code>cd /var/lib/dpkg</code></pre><h3>步骤 2：备份 info 目录</h3><p>将现有的 <code>info</code> 目录重命名为备份，防止数据丢失：</p><pre><code>sudo mv info info.bak</code></pre><h3>步骤 3：创建新的 info 目录</h3><p>创建一个新的空 <code>info</code> 目录：</p><pre><code>sudo mkdir info</code></pre><h3>步骤 4：重新更新系统</h3><p>重新执行系统更新命令，让 dpkg 重建状态数据：</p><pre><code>sudo apt-get upgrade</code></pre><p><img src="/static/img/83e08be1f28ce8365a0e89e4b5211188.03493488-b19f-421e-8d49-f157651f587c.webp" alt="操作示意图"></p><h2>更温和的解决方案</h2><blockquote><p><strong>提示</strong>：以上方法比较彻底。如果问题较轻，可以先尝试以下几种更温和的方案：</p></blockquote><h3>方法一：重新配置未完成的包</h3><p>如果有软件包安装到一半被中断，可以尝试重新配置：</p><pre><code>sudo dpkg --configure -a</code></pre><h3>方法二：强制修复依赖</h3><p>修复损坏的依赖关系：</p><pre><code>sudo apt-get install -f</code></pre><h3>方法三：清理缓存后重试</h3><p>清理 apt 缓存并重新更新软件源：</p><pre><code>sudo apt-get clean
sudo apt-get update</code></pre><blockquote><p>如果以上方法都无效，再使用本文介绍的 info 目录重建方案。</p></blockquote><h2>注意事项</h2><ul><li>操作前建议备份重要数据</li><li>info.bak 目录确认系统正常后可以删除</li><li>如果问题反复出现，建议检查硬盘是否有坏道</li></ul>`,
  },
  {
    slug: "debian-samba-guide",
    title: "Debian/Ubuntu 系统 Samba 共享服务搭建完整教程",
    date: "2026-07-16",
    excerpt: "从零开始在 Debian/Ubuntu 上搭建 Samba 文件共享服务，包含安装、配置、权限设置和常见问题排查。",
    tags: ["入门指南", "教程", "Samba", "文件共享", "Debian"],
    content: `<p>Samba 是 Linux 系统上最常用的文件共享服务之一，它可以让你的 Linux 主机与 Windows、macOS 等设备通过 SMB 协议共享文件和打印机。本文将从零开始，一步步带你在 Debian/Ubuntu 系统上搭建一个可用的 Samba 共享服务。</p><h2>1. 安装 Samba 服务器</h2><p>首先，我们需要更新系统软件包列表并安装 Samba 服务。</p><p>打开终端，切换到 root 用户执行以下命令：</p><pre><code># 更新软件包索引\napt update\n\n# 安装 Samba 服务器及相关依赖\napt install samba -y</code></pre><p>安装完成后，可以通过以下命令验证 Samba 是否安装成功：</p><pre><code>smbd --version</code></pre><h2>2. 配置 Samba 共享</h2><p>安装完成后，接下来就是配置共享目录了。</p><h3>2.1 编辑配置文件</h3><p>Samba 的主配置文件位于 <code>/etc/samba/smb.conf</code>，我们使用 nano 编辑器打开它：</p><pre><code>nano /etc/samba/smb.conf</code></pre><h3>2.2 添加共享配置</h3><p>在配置文件的末尾，添加以下内容（根据实际需求修改参数）：</p><pre><code>[Debian Server]          # 共享名称，将在网络中显示\n    path = /              # 替换为实际要共享的目录路径\n    read only = no        # 允许对共享目录进行写入操作\n    browsable = yes       # 允许在网络中被浏览发现</code></pre><blockquote><p><strong>示例</strong>：若要共享 <code>/home/user/share</code> 目录，可将 <code>path</code> 设置为 <code>/home/user/share</code>。</p></blockquote><h3>2.3 保存并退出</h3><p>编辑完成后，按 <code>Ctrl + O</code> 保存文件，再按 <code>Ctrl + X</code> 退出 nano 编辑器。</p><h2>3. 重启 Samba 服务</h2><p>配置文件修改后，需要重启 Samba 服务使配置生效：</p><pre><code>systemctl restart smbd</code></pre><blockquote><p><code>smbd</code> 是 Samba 的主要服务进程，负责处理文件共享和打印服务等核心功能。</p></blockquote><p>如果想让 Samba 在系统启动时自动运行，还可以执行：</p><pre><code>systemctl enable smbd</code></pre><h2>4. 设置 Samba 用户密码</h2><p>Samba 使用独立的用户认证系统，需要为系统用户单独设置 Samba 密码。</p><blockquote><p><strong>注意</strong>：请确保该用户已存在于系统中。如果不存在，需要先用 <code>useradd</code> 命令创建。</p></blockquote><p>执行以下命令添加 Samba 用户并设置密码：</p><pre><code>smbpasswd -a username</code></pre><p>将 <code>username</code> 替换为实际的 Debian 用户名。执行命令后，会提示输入并确认 Samba 密码，该密码用于从其他设备访问共享时进行认证。</p><h2>5. 配置共享目录权限</h2><p>为了确保 Samba 能够正常访问共享目录，需要设置合适的文件系统权限：</p><pre><code># 更改共享目录的所有者为 nobody 和 nogroup\nchown nobody:nogroup /path/to/share\n\n# 设置目录权限：所有者和组可读写执行，其他用户可读可执行\nchmod 775 /path/to/share</code></pre><blockquote><p><code>nobody</code> 和 <code>nogroup</code> 是 Samba 服务默认使用的用户和组，这样设置可以避免因用户权限不匹配导致的访问故障。</p></blockquote><p>如果你的共享目录需要特定用户才能访问，可以将所有者改为对应的用户和组。</p><h2>6. 配置防火墙（可选）</h2><p>如果系统启用了防火墙（如 UFW），需要允许 Samba 相关的网络通信通过：</p><pre><code>ufw allow samba</code></pre><p>该命令会自动配置防火墙，允许 Samba 服务使用的端口（137、138、139、445 等）通过。</p><h2>7. 访问共享目录</h2><p>完成以上步骤后，就可以从网络中的其他设备访问 Samba 共享了。</p><h3>Windows 系统</h3><p>在文件资源管理器的地址栏中输入：</p><pre><code>\\Debian的IP地址\共享名称</code></pre><p>例如：<code>\\192.168.50.100\Debian Server</code></p><p>然后输入设置的 Samba 用户名和密码，即可访问共享目录。</p><h3>macOS 系统</h3><p>在 Finder 中按下 <code>Cmd + K</code>，输入：</p><pre><code>smb://Debian的IP地址/共享名称</code></pre><h3>Linux 系统</h3><p>在文件管理器的地址栏中输入：</p><pre><code>smb://Debian的IP地址/共享名称</code></pre><h2>常见问题排查</h2><ul><li><strong>无法访问共享</strong>：检查防火墙设置和 Samba 服务状态</li><li><strong>权限不足</strong>：确认共享目录的文件系统权限和 Samba 共享权限是否正确配置</li><li><strong>密码错误</strong>：重新使用 <code>smbpasswd</code> 命令设置密码</li></ul>`,
  },
  {
    slug: "truenas-install-guide",
    title: "TrueNAS Scale 从零安装指南：小白也能看懂的 NAS 入门",
    date: "2026-07-15",
    excerpt: "从硬件选择到系统安装，从存储池创建到共享文件夹配置，一篇文章带你从零搭建第一台真正能用的 NAS。",
    featured: true,
    tags: ["入门指南", "TrueNAS", "教程"],
    content: `<p>很多人对 NAS 的第一印象是"复杂"——一堆专业术语、各种看不懂的设置项。但其实，只要理清思路，搭建一台家用 NAS 比想象中简单得多。</p><h2>一、硬件怎么选</h2><p>搭建 NAS 的第一步，是确定你的硬件方案。对于新手来说，我推荐三种路线：</p><ul><li><strong>成品 NAS</strong>：群晖、威联通——开箱即用，但价格较高</li><li><strong>自组 NAS</strong>：用废旧电脑或专门装机——性价比高，折腾空间大</li><li><strong>软路由 + NAS</strong>：一机两用，适合空间有限的用户</li></ul><p>如果你是第一次接触，建议从一台闲置的旧电脑开始，装个 TrueNAS 先玩起来，确定需求后再升级硬件。</p><h2>二、系统安装</h2><p>TrueNAS Scale 是基于 Debian 的开源 NAS 系统，功能强大且完全免费。安装过程很简单：</p><ol><li>下载官方 ISO 镜像</li><li>用 Rufus 写入 U 盘</li><li>从 U 盘启动，按提示安装</li></ol><p>安装完成后拔掉 U 盘重启，在浏览器输入 IP 地址就能进入管理界面了。</p><blockquote>记住：系统盘和数据盘一定要分开。系统装在单独的 SSD 上，数据放机械硬盘。</blockquote><h2>三、创建存储池</h2><p>存储池（Storage Pool）是 TrueNAS 的核心概念。简单来说，就是把多块硬盘组合成一个大的存储空间。</p><p>新手推荐用 <strong>RAID1（镜像）</strong> 模式：两块硬盘互为备份，一块坏了数据还在。</p><h2>四、设置共享文件夹</h2><p>有了存储池，接下来创建共享文件夹。SMB 是最常用的共享协议，Windows、Mac、手机都能访问。</p><p>配置步骤：创建数据集 → 设置权限 → 开启 SMB 共享 → 添加用户。</p><h2>五、下一步</h2><p>完成上面四步，你的 NAS 已经能用了。接下来可以折腾：</p><ul><li>安装 Docker 跑各种服务</li><li>配置远程访问，出门也能看电影</li><li>设置自动快照，防止误删文件</li></ul><p>NAS 的乐趣在于慢慢折腾，不用急着一步到位。</p>`,
  },
  {
    slug: "truenas-permission-denied",
    title: "踩坑实录：TrueNAS SMB 共享无权限？我排查了整整一下午",
    date: "2026-07-12",
    excerpt: "明明配置都对，为什么 Windows 就是访问不了共享文件夹？分享一次真实的踩坑经历和排查思路。",
    tags: ["踩坑", "报错排查", "TrueNAS"],
    content: `<p>这是我刚接触 TrueNAS 时遇到的一个坑，前前后后折腾了一下午，最后发现问题出在一个特别容易忽略的地方。</p><h2>问题现象</h2><p>创建了 SMB 共享，也添加了用户，但 Windows 访问时总是提示"您可能没有权限使用网络资源"。明明用户名密码都没错，权限也给了读写，就是进不去。</p><h2>排查思路</h2><p>我按照从易到难的顺序，逐步排除了以下可能：</p><h3>1. 网络连通性</h3><p>先 ping 一下 NAS 的 IP，通的。说明不是网络问题。</p><h3>2. 用户名密码</h3><p>重新设置用户密码，确保没有输错。还是不行。</p><h3>3. 共享权限</h3><p>检查 SMB 共享设置，确认用户有读写权限。没问题。</p><h3>4. 数据集权限</h3><p>重点来了！很多人只设置了 SMB 共享权限，却忽略了数据集本身的 Unix 权限。</p><p>我把数据集的权限从 700 改成 755，然后把所有者改成对应的用户——还是不行。</p><h2>最终原因</h2><p>最后在 TrueNAS 的论坛里找到答案：<strong>SMB 用户需要有数据集的"执行"权限才能进入目录</strong>。</p><p>而我在设置 ACL 权限时，只勾选了"读取"和"写入"，没勾"执行"。</p><p>解决方案：编辑数据集权限 → 添加用户 → 勾选"完全控制"或者手动勾选"遍历/执行"。</p><blockquote>记住：在 Unix 系统里，目录的"执行"权限 = 能否进入这个目录。</blockquote><h2>总结</h2><p>这次踩坑让我明白一个道理：NAS 的权限是分层的——数据集权限是第一道门，共享权限是第二道门，两道都开了才能进去。</p><p>遇到权限问题时，从底层往上层查，往往更快。</p>`,
  },
  {
    slug: "docker-jellyfin-guide",
    title: "Docker 部署 Jellyfin 家庭影音中心：手把手教你搭",
    date: "2026-07-08",
    excerpt: "用 Docker 在 NAS 上部署 Jellyfin，打造属于自己的私人影院。从安装到刮削，全流程指南。",
    tags: ["Docker", "场景方案", "教程"],
    content: `<p>有了 NAS，第一件事往往就是搭个家庭影音中心。Jellyfin 是完全开源的影音服务器，和 Emby、Plex 相比，它免费且功能不弱。</p><h2>为什么选 Docker</h2><p>用 Docker 部署的好处：</p><ul><li>不污染系统环境，装完直接用</li><li>升级、备份、迁移都方便</li><li>出问题删掉容器重来就行</li></ul><h2>部署步骤</h2><h3>1. 准备工作</h3><p>确保你的 NAS 已经安装了 Docker/容器管理器。然后在存储池里创建几个目录：</p><pre><code>docker/jellyfin/config   # 配置文件\ndocker/jellyfin/cache    # 缓存\nmedia/movies             # 电影\nmedia/tvshows            # 剧集</code></pre><h3>2. 编写 docker-compose.yml</h3><pre><code>services:\n  jellyfin:\n    image: jellyfin/jellyfin\n    container_name: jellyfin\n    volumes:\n      - ./config:/config\n      - ./cache:/cache\n      - /mnt/tank/media:/media\n    ports:\n      - 8096:8096\n    restart: unless-stopped</code></pre><h3>3. 启动服务</h3><p>执行 docker compose up -d，等容器启动后，在浏览器访问 NAS_IP:8096 就能进入初始化界面了。</p><h2>刮削设置</h2><p>刮削就是自动下载电影海报、简介、演员表这些元数据。Jellyfin 自带刮削插件，但国内网络访问 TheMovieDB 经常失败。</p><p>解决方案：</p><ul><li>安装 Chinese Subtitle 插件，支持豆瓣和 TMDB 刮削</li><li>配置代理，让 Jellyfin 能访问外部 API</li><li>用 TinyMediaManager 本地刮削后再导入</li></ul><h2>客户端推荐</h2><ul><li><strong>电视</strong>：Kodi + Jellyfin 插件</li><li><strong>手机</strong>：Jellyfin 官方 App</li><li><strong>电脑</strong>：直接用浏览器</li></ul><p>折腾完影音中心，你会发现：再也不用到处找资源了。</p>`,
  },
  {
    slug: "docker-portainer-recommend",
    title: "工具推荐：Portainer — 让 Docker 可视化管理变得简单",
    date: "2026-07-05",
    excerpt: "还在记 Docker 命令？试试 Portainer，一个轻量级的可视化管理界面，新手友好，功能强大。",
    tags: ["Docker", "软件工具", "工具"],
    content: `<p>刚接触 Docker 的人，往往会被一堆命令劝退——run、exec、logs、ps……光记命令就得好几天。</p><p>但有了 Portainer，这些都可以在网页上点鼠标完成。</p><h2>什么是 Portainer</h2><p>Portainer 是一个轻量级的 Docker 可视化管理工具，提供了一个直观的 Web 界面，可以：</p><ul><li>查看容器状态，一键启停</li><li>可视化查看镜像、卷、网络</li><li>通过界面部署容器，不用写命令</li><li>查看容器日志，进入终端</li><li>管理 Compose 栈</li></ul><h2>安装方法</h2><p>安装非常简单，一条命令搞定：</p><pre><code>docker run -d \\\n  -p 9000:9000 \\\n  -v /var/run/docker.sock:/var/run/docker.sock \\\n  -v portainer_data:/data \\\n  --name portainer \\\n  --restart always \\\n  portainer/portainer-ce</code></pre><p>安装完访问 NAS_IP:9000，设置管理员密码就能用了。</p><h2>为什么推荐它</h2><h3>1. 新手友好</h3><p>不用记命令，所有操作都可视化。容器挂了一眼就能看到，点一下重启按钮就搞定。</p><h3>2. 功能不弱</h3><p>社区版（CE）完全免费，家用完全够用。除了基本管理，还支持：</p><ul><li>应用模板（App Templates）：一键部署常用服务</li><li>用户和团队管理</li><li>多节点管理</li></ul><h3>3. 资源占用低</h3><p>一个容器才几十兆内存，对 NAS 来说几乎可以忽略不计。</p><h2>小技巧</h2><p>把 Portainer 设为 Docker 的第一个容器，后面装其他服务都可以在它里面操作，非常方便。</p><blockquote>工具的意义，是让我们把精力放在真正重要的事情上。</blockquote>`,
  },
  {
    slug: "nas-hard-drive-noise",
    title: "硬件踩坑：新买的硬盘一直咔咔响？原来是这么回事",
    date: "2026-07-02",
    excerpt: "新 NAS 组装好后，硬盘每隔几秒就咔哒响一声，是坏了吗？分享一次令人哭笑不得的排查经历。",
    tags: ["硬件踩坑", "踩坑", "硬盘"],
    content: `<p>这是我第一次组 NAS 时遇到的问题，当时吓得我以为买到了坏盘，差点直接退货。</p><h2>问题现象</h2><p>新装了两块 4T 西数红盘，开机后一切正常，但安静的时候总能听到硬盘每隔几秒就"咔哒"响一下，声音不大但很规律。</p><p>网上一搜，有人说这是硬盘磁头归位的声音，是正常的；也有人说这是硬盘快挂了的征兆。越看越慌。</p><h2>排查过程</h2><h3>1. 检查 SMART 信息</h3><p>先在 TrueNAS 里看了下硬盘的 SMART 数据，一切正常，坏道数是 0，重新分配扇区也是 0。</p><p>至少说明硬盘没坏。</p><h3>2. 听声音定位</h3><p>仔细听了一下，发现声音是从硬盘发出的，而且两块盘都有，同步响。</p><p>两块新盘同时出问题的概率不大，应该不是硬件故障。</p><h3>3. 定位原因</h3><p>最后在论坛里找到了答案：<strong>这是西数红盘的"节能设置"在作祟</strong>。</p><p>默认情况下，硬盘空闲几分钟后就会让磁头归位（Load/Unload Cycle），以节省电力。但 NAS 场景下，系统会定期访问硬盘（比如 SMART 自检、快照等），硬盘刚休眠又被唤醒，就会频繁咔哒响。</p><h2>解决方案</h2><p>关闭硬盘的高级电源管理（APM）：</p><ol><li>在 TrueNAS 中进入 存储 → 磁盘</li><li>找到对应的硬盘，点击编辑</li><li>把 HDD 待机设为"从不"</li><li>把高级电源管理（APM）设为 255（禁用）</li></ol><p>改完之后，咔哒声就消失了。</p><h2>后续影响</h2><p>很多人担心频繁磁头归位会影响硬盘寿命。确实，Load/Unload Cycle Count 是有设计寿命的（通常是 60 万次），如果几分钟就来一次，一年下来可能超标。</p><blockquote>NAS 硬盘就该有 NAS 的用法，别让节能设置反而害了它。</blockquote>`,
  },
  {
    slug: "remote-access-tailscale",
    title: "远程访问 NAS 的最佳方案：Tailscale 零配置组网教程",
    date: "2026-06-28",
    excerpt: "没有公网 IP？不会配置端口映射？Tailscale 让你在任何地方都能像在局域网一样访问 NAS。",
    tags: ["进阶实战", "教程", "远程访问"],
    content: `<p>很多人搭建 NAS 后遇到的第一个难题就是：<strong>出门了怎么访问家里的 NAS？</strong></p><p>传统方案（端口映射、DDNS、VPN）要么复杂，要么不安全，要么速度慢。</p><p>今天推荐的 Tailscale，是目前最简单的远程访问方案。</p><h2>Tailscale 是什么</h2><p>Tailscale 是一个基于 WireGuard 的零配置 VPN 工具。简单说就是：在你的设备上装个客户端，登录同一个账号，这些设备就自动组成了一个虚拟局域网，互相之间可以直接访问。</p><h3>它的优点</h3><ul><li><strong>零配置</strong>：不用公网 IP，不用端口映射，不用路由器设置</li><li><strong>速度快</strong>：优先打洞直连，走的不是服务器中转</li><li><strong>安全</strong>：端到端加密，Tailscale 服务器也看不到你的数据</li><li><strong>免费</strong>：个人用户 100 台设备以内免费</li></ul><h2>部署步骤</h2><h3>1. 注册账号</h3><p>去 tailscale.com 注册账号，支持 Google、GitHub、微软账号登录。</p><h3>2. NAS 端安装</h3><p>TrueNAS Scale 可以直接在应用商店里搜索 Tailscale 安装。其他系统也支持 Docker 部署：</p><pre><code>docker run -d \\\n  --name tailscale \\\n  --network=host \\\n  --privileged \\\n  -v /dev/net/tun:/dev/net/tun \\\n  -v tailscale:/var/lib/tailscale \\\n  tailscale/tailscale \\\n  tailscaled</code></pre><h3>3. 客户端安装</h3><p>手机、电脑都装上 Tailscale 客户端，登录同一个账号。</p><p>然后你就能在客户端列表里看到 NAS 了，直接用它分配的 100.x.x.x 地址就能访问。</p><h2>进阶设置</h2><h3>子网路由（Subnet Router）</h3><p>如果想让 Tailscale 访问整个家里的局域网，可以开启子网路由功能，这样出门也能访问家里的所有设备，不止是 NAS。</p><h3>MagicDNS</h3><p>开启 MagicDNS 后，可以直接用设备名访问，不用记 IP 地址。</p><h2>注意事项</h2><ul><li>大部分情况下能打洞直连，速度取决于你的上传带宽</li><li>如果打洞失败会走 DERP 中继，速度较慢，但能用</li><li>免费版完全够用，付费版主要是团队功能</li></ul><p>用了 Tailscale 之后，你会发现远程访问 NAS 原来是这么简单的事。</p>`,
  },
  {
    slug: "truenas-upgrade-failed",
    title: "系统踩坑：手贱升级 TrueNAS 导致开不了机，我是怎么救回来的",
    date: "2026-06-20",
    excerpt: "一次惊心动魄的升级翻车经历——点了下更新按钮，结果 NAS 直接变砖。分享我的抢救过程和教训。",
    tags: ["系统踩坑", "踩坑", "TrueNAS"],
    content: `<p>老话说得好：<strong>能用就别瞎升级</strong>。我之前不信，直到翻车了才明白这句话的分量。</p><h2>事情经过</h2><p>那天闲着没事，登录 TrueNAS 后台看到有个系统更新，想着"更一下应该没事"，就点了更新。</p><p>结果重启之后，系统起不来了。屏幕上一堆报错，最后停在 panic: cannot mount root。</p><p>当时心里咯噔一下：数据不会没了吧？</p><h2>冷静分析</h2><p>慌了几分钟后，我开始冷静下来：</p><ul><li>系统是装在单独的 SSD 上的，数据在机械硬盘的存储池里</li><li>只要存储池没坏，数据就没事</li><li>最坏情况：重装系统，导入存储池</li></ul><p>想通了这点，就不那么慌了。</p><h2>抢救过程</h2><h3>1. 尝试回滚</h3><p>TrueNAS 有个很好的设计：<strong>系统数据集是 ZFS 的，可以回滚快照</strong>。</p><p>重启时在启动菜单里选择之前的系统版本，看看能不能起来。</p><p>可惜我这个翻车比较彻底，旧版本也起不来。</p><h3>2. 重装系统</h3><p>那就只能重装了。重新做了个安装 U 盘，重装 TrueNAS。</p><p>这里要注意：<strong>重装时选对系统盘，千万别选到数据盘</strong>。我反复确认了三遍才点下去。</p><h3>3. 导入存储池</h3><p>装完系统进入后台，找到 存储 → 导入池，选择之前的存储池。</p><p>等待了几秒——导入成功！所有数据都在，共享配置要重新设一下，但数据完好无损。</p><blockquote>把系统和数据分开，是 NAS 最重要的安全准则。</blockquote><h2>教训总结</h2><ol><li><strong>升级前先看更新日志</strong>，没问题再更</li><li><strong>不要在生产环境追最新版</strong>，稳定比什么都重要</li><li><strong>系统和数据一定要分离</strong>，系统挂了数据还在</li><li><strong>配置要备份</strong>，TrueNAS 有导出配置的功能</li></ol><p>好在这次有惊无险，数据都保住了。但折腾了大半天，也是够累的。</p>`,
  },
  {
    slug: "nas-power-consumption",
    title: "折腾日记：为了省电，我给 NAS 做了一次功耗测试",
    date: "2026-06-15",
    excerpt: "NAS 一天到底耗多少电？一个月电费多少？用功率计实测给你看，附省电小技巧。",
    tags: ["性能调优", "折腾", "功耗"],
    content: `<p>经常有人问我：NAS 一直开着，电费贵不贵？</p><p>这个问题光靠想是想不出来的，得测。于是我买了个功率计，给我的 NAS 做了一次全面的功耗测试。</p><h2>测试环境</h2><p>先介绍一下我的 NAS 配置：</p><ul><li>CPU：J4125（赛扬四核）</li><li>内存：8G DDR4</li><li>硬盘：2 × 4T 西数红盘 + 128G SSD 系统盘</li><li>主板：ITX 工控板</li><li>电源：120W DC 电源</li></ul><p>典型的入门级家用 NAS 配置。</p><h2>测试结果</h2><table><tr><td>状态</td><td>功率</td></tr><tr><td>待机（啥也不干）</td><td>18W</td></tr><tr><td>文件复制</td><td>28W</td></tr><tr><td>Jellyfin 转码（1080p）</td><td>35W</td></tr><tr><td>硬盘休眠</td><td>10W</td></tr></table><p>一天按平均 20W 算：</p><blockquote>20W × 24h = 0.48 度/天 × 30天 = 14.4 度/月 × 0.5元/度 = 7.2元/月</blockquote><p>一个月七块多，一杯奶茶钱都不到。</p><h2>省电小技巧</h2><p>虽然已经很省了，但折腾的乐趣就在于"能不能更省"。</p><h3>1. CPU 降压</h3><p>支持 C-State 的 CPU 在空闲时会自动降频降压，这部分不用管。但有些主板默认开了高性能模式，可以在 BIOS 里改成节能模式。</p><h3>2. 硬盘休眠</h3><p>不常用的硬盘设置休眠，需要时再唤醒。两块硬盘休眠能省 8-10W。</p><p>但要注意：频繁启停反而伤硬盘，不建议设太短的休眠时间。</p><h3>3. 关闭无用服务</h3><p>不用的服务都关掉，比如不用 FTP 就关了，不用 WebDAV 也关了。每个服务占不了多少，但加起来也有几瓦。</p><h3>4. 换更省电的电源</h3><p>台式机电源在低负载下效率不高，如果是小功率 NAS，换 DC-ATX 或者直插电源能省几瓦。</p><h2>总结</h2><p>家用 NAS 的功耗其实很低，完全不用担心电费问题。与其纠结这点电费，不如想想它给你带来的便利——随时随地看电影、照片自动备份、文件随处访问……</p><p>这钱，花得值。</p>`,
  },
  {
    slug: "photo-backup-syncthing",
    title: "工具推荐：用 Syncthing 做手机照片自动备份，比云盘香多了",
    date: "2026-06-08",
    excerpt: "手机照片越来越多，云盘空间不够用？试试 Syncthing，开源免费，自动同步到你的 NAS。",
    tags: ["软件工具", "工具", "备份"],
    content: `<p>手机里的照片越来越多，几个 G 的云空间根本不够用。开会员吧，每年好几百，而且数据在别人服务器上总感觉不太踏实。</p><p>如果你有 NAS，那 Syncthing 就是照片备份的最佳方案。</p><h2>Syncthing 是什么</h2><p>Syncthing 是一个开源的点对点文件同步工具。简单说，就是在你的设备之间直接同步文件，不用经过第三方服务器。</p><h3>特点</h3><ul><li><strong>开源免费</strong>：完全免费，代码开源可审计</li><li><strong>点对点</strong>：设备之间直接同步，速度取决于你的带宽</li><li><strong>加密传输</strong>：全程 TLS 加密，安全</li><li><strong>跨平台</strong>：Windows、Mac、Linux、安卓、NAS 都能用</li></ul><h2>部署方法</h2><h3>1. NAS 端</h3><p>推荐用 Docker 部署：</p><pre><code>docker run -d \\\n  --name syncthing \\\n  -p 8384:8384 \\\n  -p 22000:22000/tcp \\\n  -p 21027:21027/udp \\\n  -v /mnt/tank/backup/phone:/data \\\n  -v syncthing_config:/config \\\n  --restart always \\\n  syncthing/syncthing</code></pre><h3>2. 手机端</h3><p>安卓手机安装 Syncthing-Fork（Google Play 或酷安能搜到）。iOS 目前官方没有客户端，可以用 PhotoSync 之类的替代。</p><h3>3. 配对同步</h3><p>两端都装好后，扫码添加设备，然后选择要同步的文件夹，设置"仅发送"或"仅接收"，就能自动同步了。</p><h2>为什么推荐它</h2><h3>1. 完全自控</h3><p>照片存在自己的 NAS 上，不用担心服务商倒闭、账号封禁、数据泄露。</p><h3>2. 没有容量限制</h3><p>NAS 有多大空间就能存多少，不用为了扩容反复付费。</p><h3>3. 多端同步</h3><p>不止是手机，电脑上的文件也能同步，相当于自建了一个私有云盘。</p><h2>注意事项</h2><ul><li>在外网同步需要两台设备都能联网，建议配合 Tailscale 使用</li><li>可以设置"仅在充电时同步"，避免耗流量和电</li><li>定期检查同步状态，防止哪里断了没发现</li></ul><p>用了 Syncthing 之后，我再也没担心过手机照片的问题——拍了就自动同步到 NAS，省心。</p>`,
  },
  {
    slug: "nas-first-month",
    title: "折腾日记：拥有第一台 NAS 的第一个月，我都干了啥",
    date: "2026-06-01",
    excerpt: "从一时冲动下单硬件，到慢慢折腾出自己的数字小窝。记录 NAS 新手第一个月的真实经历。",
    tags: ["灵感碎片", "折腾", "随笔"],
    content: `<p>距离 NAS 组装完成已经一个月了。回想一下，这一个月还挺充实的。</p><h2>第 1 周：兴奋期</h2><p>刚装好那几天，每天下班就坐在电脑前折腾。</p><ul><li>装系统、建存储池、设共享——搞定！</li><li>把电脑里攒了好几年的电影电视剧都拷进去——满满当当！</li><li>装 Jellyfin，刮削海报，看着整整齐齐的海报墙，成就感拉满</li></ul><p>那几天逢人就推荐："整个 NAS 吧，真的香！"</p><h2>第 2 周：折腾期</h2><p>新鲜劲过去之后，开始进入折腾模式：</p><ul><li>觉得默认界面不好看，换主题、改样式</li><li>看论坛说某某容器好用，装了试试，不好用又删掉</li><li>研究远程访问，试了好几种方案</li><li>折腾下载工具，qBittorrent、Aria2、Transmission 挨个试</li></ul><p>这一周 Docker 里的容器装了删、删了装，最后留下的其实就那几个。</p><h2>第 3 周：踩坑期</h2><p>折腾多了，自然就踩坑了：</p><ul><li>权限问题折腾了一下午（前面有写）</li><li>手贱升级系统差点翻车（也写了）</li><li>硬盘咔咔响吓出一身冷汗（还是写了）</li></ul><p>每个坑踩完都感觉自己又进步了一点。</p><h2>第 4 周：沉淀期</h2><p>到了第四周，反而不怎么折腾了。</p><p>NAS 就那样安安静静地跑着，每天自动备份照片、定期拉取更新、定时自检硬盘。我偶尔上去看看状态，大部分时候甚至忘了它的存在。</p><blockquote>好的工具，就是让你感觉不到它的存在。</blockquote><p>但当你需要它的时候——想看某部老电影、想找几年前的照片、想在外面访问家里的文件——它永远都在那里。</p><h2>感受</h2><p>有人说 NAS 是"男生的首饰盒"，我觉得挺对的。它不一定有多实用，但折腾的过程本身就是乐趣。</p><p>而且，当你把各种数据从各个云服务商收回到自己硬盘里的时候，那种踏实感，是云盘给不了的。</p><p>接下来准备折腾什么？可能是虚拟机，可能是软路由，也可能先歇一阵。</p><p>不急，慢慢来。</p>`,
  },
];

function readPosts(): Post[] {
  try {
    if (fs.existsSync(POSTS_PATH)) {
      const data = fs.readFileSync(POSTS_PATH, "utf-8");
      return JSON.parse(data);
    }
    fs.writeFileSync(POSTS_PATH, JSON.stringify(DEFAULT_POSTS, null, 2), "utf-8");
    return DEFAULT_POSTS;
  } catch {
    return DEFAULT_POSTS;
  }
}

function writePosts(posts: Post[]) {
  fs.writeFileSync(POSTS_PATH, JSON.stringify(posts, null, 2), "utf-8");
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 80) || String(Date.now());
}

app.get("/api/posts", (_req, res) => {
  const posts = readPosts();
  // 只返回已发布的文章（草稿不显示在公开列表）
  const published = posts.filter(p => p.status !== "draft");
  res.json({ success: true, posts: published });
});

app.get("/api/posts/all", (_req, res) => {
  const posts = readPosts();
  res.json({ success: true, posts });
});

app.get("/api/posts/:slug", (req, res) => {
  const { slug } = req.params;
  const posts = readPosts();
  const post = posts.find(p => p.slug === slug);
  if (!post) {
    res.status(404).json({ success: false, message: "文章不存在" });
    return;
  }
  // 草稿文章仅在管理后台请求时返回
  const isAdmin = req.headers["x-admin-request"] === "true";
  if (post.status === "draft" && !isAdmin) {
    res.status(404).json({ success: false, message: "文章不存在" });
    return;
  }
  res.json({ success: true, post });
});

app.post("/api/posts", (req, res) => {
  const { title, date, excerpt, content, tags, featured, category, status } = req.body;
  if (!title || !content) {
    res.status(400).json({ success: false, message: "标题和内容不能为空" });
    return;
  }
  const posts = readPosts();
  const slug = slugify(title);
  const newPost: Post = {
    slug: posts.some(p => p.slug === slug) ? `${slug}-${Date.now()}` : slug,
    title,
    date: date || new Date().toISOString().split("T")[0],
    excerpt: excerpt || content.substring(0, 150),
    content,
    tags: (tags || []).map((t: string) => t.trim()).filter((t: string) => t),
    featured: featured || false,
    category: category || undefined,
    status: status === "published" ? "published" : "draft",
  };
  posts.unshift(newPost);
  writePosts(posts);
  res.json({ success: true, post: newPost });
});

app.put("/api/posts/:slug", (req, res) => {
  const { slug } = req.params;
  const posts = readPosts();
  const index = posts.findIndex(p => p.slug === slug);
  if (index === -1) {
    res.status(404).json({ success: false, message: "文章不存在" });
    return;
  }
  const body = { ...req.body };
  if (body.tags) {
    body.tags = body.tags.map((t: string) => t.trim()).filter((t: string) => t);
  }
  posts[index] = { ...posts[index], ...body, slug };
  writePosts(posts);
  res.json({ success: true, post: posts[index] });
});

app.delete("/api/posts/:slug", (req, res) => {
  const { slug } = req.params;
  const posts = readPosts();
  const filtered = posts.filter(p => p.slug !== slug);
  if (filtered.length === posts.length) {
    res.status(404).json({ success: false, message: "文章不存在" });
    return;
  }
  writePosts(filtered);
  res.json({ success: true });
});

// 重置文章为默认数据
app.get("/api/reset-posts", (_req, res) => {
  writePosts(DEFAULT_POSTS);
  res.json({ success: true, message: "文章已重置为默认数据", count: DEFAULT_POSTS.length });
});

// 重置管理员密码
app.get("/api/reset-password", (_req, res) => {
  const db = readDB();
  const adminIndex = db.users.findIndex(u => u.username === "admin");
  if (adminIndex !== -1) {
    db.users[adminIndex].password = "admin";
    writeDB(db);
    res.json({ success: true, message: "管理员密码已重置为 admin" });
  } else {
    res.status(404).json({ success: false, message: "管理员用户不存在" });
  }
});

// ── 标签管理接口 ──

app.get("/api/tags", (_req, res) => {
  const posts = readPosts();
  const tagMap = new Map<string, number>();
  posts.forEach(post => {
    post.tags.forEach(tag => {
      tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
    });
  });
  const tags = Array.from(tagMap.entries()).map(([name, count]) => ({ name, count }));
  res.json({ success: true, tags });
});

app.put("/api/tags", (req, res) => {
  const { oldName, newName } = req.body;
  if (!oldName || !newName) {
    res.status(400).json({ success: false, message: "参数不完整" });
    return;
  }
  if (oldName === newName) {
    res.json({ success: true, message: "标签名称未变化" });
    return;
  }

  const posts = readPosts();
  let changed = false;
  posts.forEach(post => {
    if (post.tags.includes(oldName)) {
      post.tags = post.tags.map(t => (t === oldName ? newName : t));
      changed = true;
    }
  });

  if (changed) {
    writePosts(posts);
    res.json({ success: true, message: "标签名称已更新" });
  } else {
    res.status(404).json({ success: false, message: "标签不存在" });
  }
});

app.delete("/api/tags/:name", (req, res) => {
  const { name } = req.params;
  const posts = readPosts();
  let changed = false;
  posts.forEach(post => {
    const beforeLength = post.tags.length;
    post.tags = post.tags.filter(t => t !== name);
    if (post.tags.length !== beforeLength) {
      changed = true;
    }
  });

  if (changed) {
    writePosts(posts);
    res.json({ success: true, message: "标签已删除" });
  } else {
    res.status(404).json({ success: false, message: "标签不存在" });
  }
});

// ── 分类管理接口 ──

const CATEGORIES_PATH = path.join(__dirname, "db", "categories.json");

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  createdAt: number;
  updatedAt: number;
}

const readCategories = (): Category[] => {
  if (!fs.existsSync(CATEGORIES_PATH)) {
    const defaultCategories: Category[] = [
      { id: "1", name: "教程系列", slug: "tutorial", description: "详细的技术教程", createdAt: Date.now(), updatedAt: Date.now() },
      { id: "2", name: "踩坑实录", slug: "troubleshoot", description: "遇到的问题和解决方案", createdAt: Date.now(), updatedAt: Date.now() },
      { id: "3", name: "工具推荐", slug: "tools", description: "好用的工具推荐", createdAt: Date.now(), updatedAt: Date.now() },
      { id: "4", name: "折腾日记", slug: "diary", description: "日常折腾记录", createdAt: Date.now(), updatedAt: Date.now() },
    ];
    writeCategories(defaultCategories);
    return defaultCategories;
  }
  return JSON.parse(fs.readFileSync(CATEGORIES_PATH, "utf-8"));
};

const writeCategories = (categories: Category[]) => {
  fs.writeFileSync(CATEGORIES_PATH, JSON.stringify(categories, null, 2), "utf-8");
};

const generateId = () => Math.random().toString(36).substring(2, 15);

app.get("/api/categories", (_req, res) => {
  const categories = readCategories();
  const posts = readPosts();
  
  const categoriesWithCount = categories.map(cat => {
    const count = posts.filter(p => p.category === cat.slug).length;
    return { ...cat, count };
  });
  
  res.json({ success: true, categories: categoriesWithCount });
});

app.post("/api/categories", (req, res) => {
  const { name, slug, description } = req.body;
  if (!name || !slug) {
    res.status(400).json({ success: false, message: "分类名称和别名不能为空" });
    return;
  }

  const categories = readCategories();
  if (categories.some(c => c.name === name)) {
    res.status(400).json({ success: false, message: "分类名称已存在" });
    return;
  }
  if (categories.some(c => c.slug === slug)) {
    res.status(400).json({ success: false, message: "分类别名已存在" });
    return;
  }

  const newCategory: Category = {
    id: generateId(),
    name: name.trim(),
    slug: slug.trim().toLowerCase(),
    description: description ? description.trim() : "",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  categories.push(newCategory);
  writeCategories(categories);
  res.json({ success: true, category: newCategory });
});

app.put("/api/categories/:id", (req, res) => {
  const { id } = req.params;
  const { name, slug, description } = req.body;

  const categories = readCategories();
  const index = categories.findIndex(c => c.id === id);
  if (index === -1) {
    res.status(404).json({ success: false, message: "分类不存在" });
    return;
  }

  if (name && categories.some(c => c.name === name && c.id !== id)) {
    res.status(400).json({ success: false, message: "分类名称已存在" });
    return;
  }
  if (slug && categories.some(c => c.slug === slug && c.id !== id)) {
    res.status(400).json({ success: false, message: "分类别名已存在" });
    return;
  }

  const oldSlug = categories[index].slug;
  categories[index] = {
    ...categories[index],
    name: name ? name.trim() : categories[index].name,
    slug: slug ? slug.trim().toLowerCase() : categories[index].slug,
    description: description !== undefined ? description.trim() : categories[index].description,
    updatedAt: Date.now(),
  };

  writeCategories(categories);

  if (slug && slug.trim().toLowerCase() !== oldSlug) {
    const posts = readPosts();
    posts.forEach(post => {
      if (post.category === oldSlug) {
        post.category = slug.trim().toLowerCase();
      }
    });
    writePosts(posts);
  }

  res.json({ success: true, category: categories[index] });
});

app.delete("/api/categories/:id", (req, res) => {
  const { id } = req.params;

  const categories = readCategories();
  const index = categories.findIndex(c => c.id === id);
  if (index === -1) {
    res.status(404).json({ success: false, message: "分类不存在" });
    return;
  }

  const deletedCategory = categories[index];
  categories.splice(index, 1);
  writeCategories(categories);

  const posts = readPosts();
  posts.forEach(post => {
    if (post.category === deletedCategory.slug) {
      delete post.category;
    }
  });
  writePosts(posts);

  res.json({ success: true, message: "分类已删除" });
});

// ── 站点设置接口 ──

const SITE_SETTINGS_KEY = "site-settings";
const DEFAULT_SETTINGS = {
  title: "那斯小棧",
  description: "在代码与硬盘的缝隙里，记录每一次 NAS 折腾的踩坑与顿悟。",
};

const SETTINGS_PATH = path.join(__dirname, "db", "settings.json");

function readSettings() {
  try {
    if (fs.existsSync(SETTINGS_PATH)) {
      const data = fs.readFileSync(SETTINGS_PATH, "utf-8");
      return JSON.parse(data);
    }
    return DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function writeSettings(settings: any) {
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2), "utf-8");
}

app.get("/api/site-settings", (_req, res) => {
  const settings = readSettings();
  res.json({ success: true, settings });
});

app.put("/api/site-settings", (req, res) => {
  const settings = { ...readSettings(), ...req.body };
  writeSettings(settings);
  res.json({ success: true, settings });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
