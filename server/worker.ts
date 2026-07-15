// Cloudflare Worker 入口 - 兼容 Workers 运行时
// 使用 KV 存储用户数据，替代 fs + JSON 文件

export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  role: string;
}

export interface Env {
  USERS_KV: KVNamespace;
  MAIL_FROM?: string;
  MAIL_FROM_NAME?: string;
}

const USERS_KEY = "users";
const CODE_TTL_SECONDS = 10 * 60; // 10 分钟

function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

async function readUsers(kv: KVNamespace): Promise<User[]> {
  const raw = await kv.get(USERS_KEY);
  if (!raw) {
    // 初始化默认管理员
    const defaultUsers: User[] = [
      {
        id: "1",
        username: "admin",
        email: "admin@shiguang.dev",
        password: "admin",
        role: "admin",
      },
    ];
    await kv.put(USERS_KEY, JSON.stringify(defaultUsers));
    return defaultUsers;
  }
  return JSON.parse(raw);
}

async function writeUsers(kv: KVNamespace, users: User[]): Promise<void> {
  await kv.put(USERS_KEY, JSON.stringify(users));
}

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendEmail(env: Env, to: string, code: string): Promise<boolean> {
  if (!env.MAIL_FROM) {
    return false;
  }
  try {
    const response = await fetch("https://api.mailchannels.net/tx/v1/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: env.MAIL_FROM, name: env.MAIL_FROM_NAME || "拾光笔记" },
        subject: "拾光笔记 - 密码重置验证码",
        content: [
          {
            type: "text/html",
            value: `
              <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
                <h2 style="color: #3b82f6;">拾光笔记</h2>
                <p>您正在进行密码重置操作，验证码如下：</p>
                <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #3b82f6; margin: 24px 0;">${code}</div>
                <p style="color: #666;">验证码 10 分钟内有效，请勿泄露给他人。</p>
              </div>
            `,
          },
        ],
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // 处理 CORS 预检
    if (method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    // 登录
    if (path === "/api/login" && method === "POST") {
      const { username, password } = await request.json();
      const users = await readUsers(env.USERS_KV);
      const user = users.find(u => u.username === username && u.password === password);
      if (user) {
        return jsonResponse({
          success: true,
          user: { id: user.id, username: user.username, email: user.email, role: user.role },
        });
      }
      return jsonResponse({ success: false, message: "用户名或密码错误" }, 401);
    }

    // 获取用户信息
    const userMatch = path.match(/^\/api\/users\/(\w+)$/);
    if (userMatch && method === "GET") {
      const id = userMatch[1];
      const users = await readUsers(env.USERS_KV);
      const user = users.find(u => u.id === id);
      if (user) {
        return jsonResponse({
          success: true,
          user: { id: user.id, username: user.username, email: user.email, role: user.role },
        });
      }
      return jsonResponse({ success: false, message: "用户不存在" }, 404);
    }

    // 修改个人信息
    const profileMatch = path.match(/^\/api\/users\/(\w+)\/profile$/);
    if (profileMatch && method === "PUT") {
      const id = profileMatch[1];
      const { username, email } = await request.json();
      const users = await readUsers(env.USERS_KV);
      const index = users.findIndex(u => u.id === id);
      if (index !== -1) {
        users[index].username = username;
        users[index].email = email;
        await writeUsers(env.USERS_KV, users);
        return jsonResponse({
          success: true,
          user: { id: users[index].id, username: users[index].username, email: users[index].email, role: users[index].role },
        });
      }
      return jsonResponse({ success: false, message: "用户不存在" }, 404);
    }

    // 修改密码
    const passwordMatch = path.match(/^\/api\/users\/(\w+)\/password$/);
    if (passwordMatch && method === "PUT") {
      const id = passwordMatch[1];
      const { currentPassword, newPassword } = await request.json();
      const users = await readUsers(env.USERS_KV);
      const index = users.findIndex(u => u.id === id);
      if (index !== -1) {
        if (users[index].password === currentPassword) {
          users[index].password = newPassword;
          await writeUsers(env.USERS_KV, users);
          return jsonResponse({ success: true, message: "密码修改成功" });
        }
        return jsonResponse({ success: false, message: "当前密码错误" }, 401);
      }
      return jsonResponse({ success: false, message: "用户不存在" }, 404);
    }

    // 发送验证码
    if (path === "/api/auth/forgot-password/send-code" && method === "POST") {
      const { email } = await request.json();
      if (!email) {
        return jsonResponse({ success: false, message: "请输入邮箱地址" }, 400);
      }
      const users = await readUsers(env.USERS_KV);
      const user = users.find(u => u.email === email);
      if (!user) {
        return jsonResponse({ success: false, message: "该邮箱未绑定管理员账户" }, 400);
      }

      const code = generateCode();
      await env.USERS_KV.put(`code:${email}`, code, { expirationTtl: CODE_TTL_SECONDS });

      const sent = await sendEmail(env, email, code);
      if (!sent) {
        return jsonResponse({ success: false, message: "邮件服务未配置，请联系管理员" }, 500);
      }
      return jsonResponse({ success: true, message: "验证码已发送，请查收邮件" });
    }

    // 重置密码
    if (path === "/api/auth/forgot-password/reset" && method === "POST") {
      const { email, code, newPassword } = await request.json();
      if (!email || !code || !newPassword) {
        return jsonResponse({ success: false, message: "参数不完整" }, 400);
      }
      if (newPassword.length < 6) {
        return jsonResponse({ success: false, message: "新密码长度至少为 6 位" }, 400);
      }

      const cachedCode = await env.USERS_KV.get(`code:${email}`);
      if (!cachedCode || cachedCode !== code) {
        return jsonResponse({ success: false, message: "验证码错误或已过期" }, 400);
      }

      const users = await readUsers(env.USERS_KV);
      const index = users.findIndex(u => u.email === email);
      if (index === -1) {
        return jsonResponse({ success: false, message: "用户不存在" }, 404);
      }

      users[index].password = newPassword;
      await writeUsers(env.USERS_KV, users);
      await env.USERS_KV.delete(`code:${email}`);

      return jsonResponse({ success: true, message: "密码重置成功，请使用新密码登录" });
    }

    return jsonResponse({ success: false, message: "Not Found" }, 404);
  },
};
