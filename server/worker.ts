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
  IMAGES_BUCKET: R2Bucket;
  MAIL_FROM?: string;
  MAIL_FROM_NAME?: string;
  IMAGE_CDN_URL?: string;
}

const USERS_KEY = "users";
const SITE_SETTINGS_KEY = "site_settings";
const POSTS_KEY = "posts";

interface SiteSettings {
  title: string;
  description: string;
}

interface Post {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  content: string;
  tags: string[];
  featured?: boolean;
}

const DEFAULT_POSTS: Post[] = [
  {
    slug: "debian-samba-guide",
    title: "Debian/Ubuntu 系统 Samba 共享服务搭建完整教程",
    date: "2026-07-16",
    excerpt:
      "从零开始在 Debian/Ubuntu 上搭建 Samba 文件共享服务，包含安装、配置、权限设置和常见问题排查。",
    tags: ["入门指南", "教程", "Samba", "文件共享", "Debian"],
    content: `<p>Samba 是 Linux 系统上最常用的文件共享服务之一，它可以让你的 Linux 主机与 Windows、macOS 等设备通过 SMB 协议共享文件和打印机。本文将从零开始，一步步带你在 Debian/Ubuntu 系统上搭建一个可用的 Samba 共享服务。</p><h2>1. 安装 Samba 服务器</h2><p>首先，我们需要更新系统软件包列表并安装 Samba 服务。</p><p>打开终端，切换到 root 用户执行以下命令：</p><pre><code># 更新软件包索引\napt update\n\n# 安装 Samba 服务器及相关依赖\napt install samba -y</code></pre><p>安装完成后，可以通过以下命令验证 Samba 是否安装成功：</p><pre><code>smbd --version</code></pre><h2>2. 配置 Samba 共享</h2><p>安装完成后，接下来就是配置共享目录了。</p><h3>2.1 编辑配置文件</h3><p>Samba 的主配置文件位于 <code>/etc/samba/smb.conf</code>，我们使用 nano 编辑器打开它：</p><pre><code>nano /etc/samba/smb.conf</code></pre><h3>2.2 添加共享配置</h3><p>在配置文件的末尾，添加以下内容（根据实际需求修改参数）：</p><pre><code>[Debian Server]          # 共享名称，将在网络中显示\n    path = /              # 替换为实际要共享的目录路径\n    read only = no        # 允许对共享目录进行写入操作\n    browsable = yes       # 允许在网络中被浏览发现</code></pre><blockquote><p><strong>示例</strong>：若要共享 <code>/home/user/share</code> 目录，可将 <code>path</code> 设置为 <code>/home/user/share</code>。</p></blockquote><h3>2.3 保存并退出</h3><p>编辑完成后，按 <code>Ctrl + O</code> 保存文件，再按 <code>Ctrl + X</code> 退出 nano 编辑器。</p><h2>3. 重启 Samba 服务</h2><p>配置文件修改后，需要重启 Samba 服务使配置生效：</p><pre><code>systemctl restart smbd</code></pre><blockquote><p><code>smbd</code> 是 Samba 的主要服务进程，负责处理文件共享和打印服务等核心功能。</p></blockquote><p>如果想让 Samba 在系统启动时自动运行，还可以执行：</p><pre><code>systemctl enable smbd</code></pre><h2>4. 设置 Samba 用户密码</h2><p>Samba 使用独立的用户认证系统，需要为系统用户单独设置 Samba 密码。</p><blockquote><p><strong>注意</strong>：请确保该用户已存在于系统中。如果不存在，需要先用 <code>useradd</code> 命令创建。</p></blockquote><p>执行以下命令添加 Samba 用户并设置密码：</p><pre><code>smbpasswd -a username</code></pre><p>将 <code>username</code> 替换为实际的 Debian 用户名。执行命令后，会提示输入并确认 Samba 密码，该密码用于从其他设备访问共享时进行认证。</p><h2>5. 配置共享目录权限</h2><p>为了确保 Samba 能够正常访问共享目录，需要设置合适的文件系统权限：</p><pre><code># 更改共享目录的所有者为 nobody 和 nogroup\nchown nobody:nogroup /path/to/share\n\n# 设置目录权限：所有者和组可读写执行，其他用户可读可执行\nchmod 775 /path/to/share</code></pre><blockquote><p><code>nobody</code> 和 <code>nogroup</code> 是 Samba 服务默认使用的用户和组，这样设置可以避免因用户权限不匹配导致的访问故障。</p></blockquote><p>如果你的共享目录需要特定用户才能访问，可以将所有者改为对应的用户和组。</p><h2>6. 配置防火墙（可选）</h2><p>如果系统启用了防火墙（如 UFW），需要允许 Samba 相关的网络通信通过：</p><pre><code>ufw allow samba</code></pre><p>该命令会自动配置防火墙，允许 Samba 服务使用的端口（137、138、139、445 等）通过。</p><h2>7. 访问共享目录</h2><p>完成以上步骤后，就可以从网络中的其他设备访问 Samba 共享了。</p><h3>Windows 系统</h3><p>在文件资源管理器的地址栏中输入：</p><pre><code>\\\\Debian的IP地址\\共享名称</code></pre><p>例如：<code>\\\\192.168.50.100\\Debian Server</code></p><p>然后输入设置的 Samba 用户名和密码，即可访问共享目录。</p><h3>macOS 系统</h3><p>在 Finder 中按下 <code>Cmd + K</code>，输入：</p><pre><code>smb://Debian的IP地址/共享名称</code></pre><h3>Linux 系统</h3><p>在文件管理器的地址栏中输入：</p><pre><code>smb://Debian的IP地址/共享名称</code></pre><h2>常见问题排查</h2><ul><li><strong>无法访问共享</strong>：检查防火墙设置和 Samba 服务状态</li><li><strong>权限不足</strong>：确认共享目录的文件系统权限和 Samba 共享权限是否正确配置</li><li><strong>密码错误</strong>：重新使用 <code>smbpasswd</code> 命令设置密码</li></ul>`,
  },
  {
    slug: "truenas-install-guide",
    title: "TrueNAS Scale 从零安装指南：小白也能看懂的 NAS 入门",
    date: "2026-07-15",
    excerpt:
      "从硬件选择到系统安装，从存储池创建到共享文件夹配置，一篇文章带你从零搭建第一台真正能用的 NAS。",
    featured: true,
    tags: ["入门指南", "TrueNAS", "教程"],
    content: `<p>很多人对 NAS 的第一印象是"复杂"——一堆专业术语、各种看不懂的设置项。但其实，只要理清思路，搭建一台家用 NAS 比想象中简单得多。</p><h2>一、硬件怎么选</h2><p>搭建 NAS 的第一步，是确定你的硬件方案。对于新手来说，我推荐三种路线：</p><ul><li><strong>成品 NAS</strong>：群晖、威联通——开箱即用，但价格较高</li><li><strong>自组 NAS</strong>：用废旧电脑或专门装机——性价比高，折腾空间大</li><li><strong>软路由 + NAS</strong>：一机两用，适合空间有限的用户</li></ul><p>如果你是第一次接触，建议从一台闲置的旧电脑开始，装个 TrueNAS 先玩起来，确定需求后再升级硬件。</p><h2>二、系统安装</h2><p>TrueNAS Scale 是基于 Debian 的开源 NAS 系统，功能强大且完全免费。安装过程很简单：</p><ol><li>下载官方 ISO 镜像</li><li>用 Rufus 写入 U 盘</li><li>从 U 盘启动，按提示安装</li></ol><p>安装完成后拔掉 U 盘重启，在浏览器输入 IP 地址就能进入管理界面了。</p><blockquote>记住：系统盘和数据盘一定要分开。系统装在单独的 SSD 上，数据放机械硬盘。</blockquote><h2>三、创建存储池</h2><p>存储池（Storage Pool）是 TrueNAS 的核心概念。简单来说，就是把多块硬盘组合成一个大的存储空间。</p><p>新手推荐用 <strong>RAID1（镜像）</strong> 模式：两块硬盘互为备份，一块坏了数据还在。</p><h2>四、设置共享文件夹</h2><p>有了存储池，接下来创建共享文件夹。SMB 是最常用的共享协议，Windows、Mac、手机都能访问。</p><p>配置步骤：创建数据集 → 设置权限 → 开启 SMB 共享 → 添加用户。</p><h2>五、下一步</h2><p>完成上面四步，你的 NAS 已经能用了。接下来可以折腾：</p><ul><li>安装 Docker 跑各种服务</li><li>配置远程访问，出门也能看电影</li><li>设置自动快照，防止误删文件</li></ul><p>NAS 的乐趣在于慢慢折腾，不用急着一步到位。</p>`,
  },
  {
    slug: "truenas-permission-denied",
    title: "踩坑实录：TrueNAS SMB 共享无权限？我排查了整整一下午",
    date: "2026-07-12",
    excerpt:
      "明明配置都对，为什么 Windows 就是访问不了共享文件夹？分享一次真实的踩坑经历和排查思路。",
    tags: ["踩坑", "报错排查", "TrueNAS"],
    content: `<p>这是我刚接触 TrueNAS 时遇到的一个坑，前前后后折腾了一下午，最后发现问题出在一个特别容易忽略的地方。</p><h2>问题现象</h2><p>创建了 SMB 共享，也添加了用户，但 Windows 访问时总是提示"您可能没有权限使用网络资源"。明明用户名密码都没错，权限也给了读写，就是进不去。</p><h2>排查思路</h2><p>我按照从易到难的顺序，逐步排除了以下可能：</p><h3>1. 网络连通性</h3><p>先 <code>ping</code> 一下 NAS 的 IP，通的。说明不是网络问题。</p><h3>2. 用户名密码</h3><p>重新设置用户密码，确保没有输错。还是不行。</p><h3>3. 共享权限</h3><p>检查 SMB 共享设置，确认用户有读写权限。没问题。</p><h3>4. 数据集权限</h3><p>重点来了！很多人只设置了 SMB 共享权限，却忽略了数据集本身的 Unix 权限。</p><p>我把数据集的权限从 <code>700</code> 改成 <code>755</code>，然后把所有者改成对应的用户——还是不行。</p><h2>最终原因</h2><p>最后在 TrueNAS 的论坛里找到答案：<strong>SMB 用户需要有数据集的"执行"权限才能进入目录</strong>。</p><p>而我在设置 ACL 权限时，只勾选了"读取"和"写入"，没勾"执行"。</p><p>解决方案：编辑数据集权限 → 添加用户 → 勾选"完全控制"或者手动勾选"遍历/执行"。</p><blockquote>记住：在 Unix 系统里，目录的"执行"权限 = 能否进入这个目录。</blockquote><h2>总结</h2><p>这次踩坑让我明白一个道理：NAS 的权限是分层的——数据集权限是第一道门，共享权限是第二道门，两道都开了才能进去。</p><p>遇到权限问题时，从底层往上层查，往往更快。</p>`,
  },
  {
    slug: "docker-jellyfin-guide",
    title: "Docker 部署 Jellyfin 家庭影音中心：手把手教你搭",
    date: "2026-07-08",
    excerpt:
      "用 Docker 在 NAS 上部署 Jellyfin，打造属于自己的私人影院。从安装到刮削，全流程指南。",
    tags: ["Docker", "场景方案", "教程"],
    content: `<p>有了 NAS，第一件事往往就是搭个家庭影音中心。Jellyfin 是完全开源的影音服务器，和 Emby、Plex 相比，它免费且功能不弱。</p><h2>为什么选 Docker</h2><p>用 Docker 部署的好处：</p><ul><li>不污染系统环境，装完直接用</li><li>升级、备份、迁移都方便</li><li>出问题删掉容器重来就行</li></ul><h2>部署步骤</h2><h3>1. 准备工作</h3><p>确保你的 NAS 已经安装了 Docker/容器管理器。然后在存储池里创建几个目录：</p><pre><code>docker/jellyfin/config   # 配置文件\ndocker/jellyfin/cache    # 缓存\nmedia/movies             # 电影\nmedia/tvshows            # 剧集</code></pre><h3>2. 编写 docker-compose.yml</h3><pre><code>services:\n  jellyfin:\n    image: jellyfin/jellyfin\n    container_name: jellyfin\n    volumes:\n      - ./config:/config\n      - ./cache:/cache\n      - /mnt/tank/media:/media\n    ports:\n      - 8096:8096\n    restart: unless-stopped</code></pre><h3>3. 启动服务</h3><p>执行 <code>docker compose up -d</code>，等容器启动后，在浏览器访问 <code>NAS_IP:8096</code> 就能进入初始化界面了。</p><h2>刮削设置</h2><p>刮削就是自动下载电影海报、简介、演员表这些元数据。Jellyfin 自带刮削插件，但国内网络访问 TheMovieDB 经常失败。</p><p>解决方案：</p><ul><li>安装 <strong>Chinese Subtitle</strong> 插件，支持豆瓣和 TMDB 刮削</li><li>配置代理，让 Jellyfin 能访问外部 API</li><li>用 TinyMediaManager 本地刮削后再导入</li></ul><h2>客户端推荐</h2><ul><li><strong>电视</strong>：Kodi + Jellyfin 插件</li><li><strong>手机</strong>：Jellyfin 官方 App</li><li><strong>电脑</strong>：直接用浏览器</li></ul><p>折腾完影音中心，你会发现：再也不用到处找资源了。</p>`,
  },
  {
    slug: "docker-portainer-recommend",
    title: "工具推荐：Portainer — 让 Docker 可视化管理变得简单",
    date: "2026-07-05",
    excerpt:
      "还在记 Docker 命令？试试 Portainer，一个轻量级的可视化管理界面，新手友好，功能强大。",
    tags: ["Docker", "软件工具", "工具"],
    content: `<p>刚接触 Docker 的人，往往会被一堆命令劝退——run、exec、logs、ps……光记命令就得好几天。</p><p>但有了 Portainer，这些都可以在网页上点鼠标完成。</p><h2>什么是 Portainer</h2><p>Portainer 是一个轻量级的 Docker 可视化管理工具，提供了一个直观的 Web 界面，可以：</p><ul><li>查看容器状态，一键启停</li><li>可视化查看镜像、卷、网络</li><li>通过界面部署容器，不用写命令</li><li>查看容器日志，进入终端</li><li>管理 Compose 栈</li></ul><h2>安装方法</h2><p>安装非常简单，一条命令搞定：</p><pre><code>docker run -d \\\n  -p 9000:9000 \\\n  -v /var/run/docker.sock:/var/run/docker.sock \\\n  -v portainer_data:/data \\\n  --name portainer \\\n  --restart always \\\n  portainer/portainer-ce</code></pre><p>安装完访问 <code>NAS_IP:9000</code>，设置管理员密码就能用了。</p><h2>为什么推荐它</h2><h3>1. 新手友好</h3><p>不用记命令，所有操作都可视化。容器挂了一眼就能看到，点一下重启按钮就搞定。</p><h3>2. 功能不弱</h3><p>社区版（CE）完全免费，家用完全够用。除了基本管理，还支持：</p><ul><li>应用模板（App Templates）：一键部署常用服务</li><li>用户和团队管理</li><li>多节点管理</li></ul><h3>3. 资源占用低</h2><p>一个容器才几十兆内存，对 NAS 来说几乎可以忽略不计。</p><h2>小技巧</h2><p>把 Portainer 设为 Docker 的第一个容器，后面装其他服务都可以在它里面操作，非常方便。</p><blockquote>工具的意义，是让我们把精力放在真正重要的事情上。</blockquote>`,
  },
  {
    slug: "nas-hard-drive-noise",
    title: "硬件踩坑：新买的硬盘一直咔咔响？原来是这么回事",
    date: "2026-07-02",
    excerpt:
      "新 NAS 组装好后，硬盘每隔几秒就咔哒响一声，是坏了吗？分享一次令人哭笑不得的排查经历。",
    tags: ["硬件踩坑", "踩坑", "硬盘"],
    content: `<p>这是我第一次组 NAS 时遇到的问题，当时吓得我以为买到了坏盘，差点直接退货。</p><h2>问题现象</h2><p>新装了两块 4T 西数红盘，开机后一切正常，但安静的时候总能听到硬盘每隔几秒就"咔哒"响一下，声音不大但很规律。</p><p>网上一搜，有人说这是硬盘磁头归位的声音，是正常的；也有人说这是硬盘快挂了的征兆。越看越慌。</p><h2>排查过程</h2><h3>1. 检查 SMART 信息</h3><p>先在 TrueNAS 里看了下硬盘的 SMART 数据，一切正常，坏道数是 0，重新分配扇区也是 0。</p><p>至少说明硬盘没坏。</p><h3>2. 听声音定位</h3><p>仔细听了一下，发现声音是从硬盘发出的，而且两块盘都有，同步响。</p><p>两块新盘同时出问题的概率不大，应该不是硬件故障。</p><h3>3. 定位原因</h3><p>最后在论坛里找到了答案：<strong>这是西数红盘的"节能设置"在作祟</strong>。</p><p>默认情况下，硬盘空闲几分钟后就会让磁头归位（Load/Unload Cycle），以节省电力。但 NAS 场景下，系统会定期访问硬盘（比如 SMART 自检、快照等），硬盘刚休眠又被唤醒，就会频繁咔哒响。</p><h2>解决方案</h2><p>关闭硬盘的高级电源管理（APM）：</p><ol><li>在 TrueNAS 中进入 存储 → 磁盘</li><li>找到对应的硬盘，点击编辑</li><li>把 HDD 待机设为"从不"</li><li>把高级电源管理（APM）设为 255（禁用）</li></ol><p>改完之后，咔哒声就消失了。</p><h2>后续影响</h2><p>很多人担心频繁磁头归位会影响硬盘寿命。确实，Load/Unload Cycle Count 是有设计寿命的（通常是 60 万次），如果几分钟就来一次，一年下来可能超标。</p><blockquote>NAS 硬盘就该有 NAS 的用法，别让节能设置反而害了它。</blockquote>`,
  },
  {
    slug: "remote-access-tailscale",
    title: "远程访问 NAS 的最佳方案：Tailscale 零配置组网教程",
    date: "2026-06-28",
    excerpt:
      "没有公网 IP？不会配置端口映射？Tailscale 让你在任何地方都能像在局域网一样访问 NAS。",
    tags: ["进阶实战", "教程", "远程访问"],
    content: `<p>很多人搭建 NAS 后遇到的第一个难题就是：<strong>出门了怎么访问家里的 NAS？</strong></p><p>传统方案（端口映射、DDNS、VPN）要么复杂，要么不安全，要么速度慢。</p><p>今天推荐的 Tailscale，是目前最简单的远程访问方案。</p><h2>Tailscale 是什么</h2><p>Tailscale 是一个基于 WireGuard 的零配置 VPN 工具。简单说就是：在你的设备上装个客户端，登录同一个账号，这些设备就自动组成了一个虚拟局域网，互相之间可以直接访问。</p><h3>它的优点</h3><ul><li><strong>零配置</strong>：不用公网 IP，不用端口映射，不用路由器设置</li><li><strong>速度快</strong>：优先打洞直连，走的不是服务器中转</li><li><strong>安全</strong>：端到端加密，Tailscale 服务器也看不到你的数据</li><li><strong>免费</strong>：个人用户 100 台设备以内免费</li></ul><h2>部署步骤</h2><h3>1. 注册账号</h3><p>去 tailscale.com 注册账号，支持 Google、GitHub、微软账号登录。</p><h3>2. NAS 端安装</h3><p>TrueNAS Scale 可以直接在应用商店里搜索 Tailscale 安装。其他系统也支持 Docker 部署：</p><pre><code>docker run -d \\\n  --name tailscale \\\n  --network=host \\\n  --privileged \\\n  -v /dev/net/tun:/dev/net/tun \\\n  -v tailscale:/var/lib/tailscale \\\n  tailscale/tailscale \\\n  tailscaled</code></pre><h3>3. 客户端安装</h3><p>手机、电脑都装上 Tailscale 客户端，登录同一个账号。</p><p>然后你就能在客户端列表里看到 NAS 了，直接用它分配的 100.x.x.x 地址就能访问。</p><h2>进阶设置</h2><h3>子网路由（Subnet Router）</h3><p>如果想让 Tailscale 访问整个家里的局域网，可以开启子网路由功能，这样出门也能访问家里的所有设备，不止是 NAS。</p><h3>MagicDNS</h3><p>开启 MagicDNS 后，可以直接用设备名访问，不用记 IP 地址。</p><h2>注意事项</h2><ul><li>大部分情况下能打洞直连，速度取决于你的上传带宽</li><li>如果打洞失败会走 DERP 中继，速度较慢，但能用</li><li>免费版完全够用，付费版主要是团队功能</li></ul><p>用了 Tailscale 之后，你会发现远程访问 NAS 原来是这么简单的事。</p>`,
  },
  {
    slug: "truenas-upgrade-failed",
    title: "系统踩坑：手贱升级 TrueNAS 导致开不了机，我是怎么救回来的",
    date: "2026-06-20",
    excerpt:
      "一次惊心动魄的升级翻车经历——点了下更新按钮，结果 NAS 直接变砖。分享我的抢救过程和教训。",
    tags: ["系统踩坑", "踩坑", "TrueNAS"],
    content: `<p>老话说得好：<strong>能用就别瞎升级</strong>。我之前不信，直到翻车了才明白这句话的分量。</p><h2>事情经过</h2><p>那天闲着没事，登录 TrueNAS 后台看到有个系统更新，想着"更一下应该没事"，就点了更新。</p><p>结果重启之后，系统起不来了。屏幕上一堆报错，最后停在 <code>panic: cannot mount root</code>。</p><p>当时心里咯噔一下：数据不会没了吧？</p><h2>冷静分析</h2><p>慌了几分钟后，我开始冷静下来：</p><ul><li>系统是装在单独的 SSD 上的，数据在机械硬盘的存储池里</li><li>只要存储池没坏，数据就没事</li><li>最坏情况：重装系统，导入存储池</li></ul><p>想通了这点，就不那么慌了。</p><h2>抢救过程</h2><h3>1. 尝试回滚</h3><p>TrueNAS 有个很好的设计：<strong>系统数据集是 ZFS 的，可以回滚快照</strong>。</p><p>重启时在启动菜单里选择之前的系统版本，看看能不能起来。</p><p>可惜我这个翻车比较彻底，旧版本也起不来。</p><h3>2. 重装系统</h3><p>那就只能重装了。重新做了个安装 U 盘，重装 TrueNAS。</p><p>这里要注意：<strong>重装时选对系统盘，千万别选到数据盘</strong>。我反复确认了三遍才点下去。</p><h3>3. 导入存储池</h3><p>装完系统进入后台，找到 存储 → 导入池，选择之前的存储池。</p><p>等待了几秒——导入成功！所有数据都在，共享配置要重新设一下，但数据完好无损。</p><blockquote>把系统和数据分开，是 NAS 最重要的安全准则。</blockquote><h2>教训总结</h2><ol><li><strong>升级前先看更新日志</strong>，没问题再更</li><li><strong>不要在生产环境追最新版</strong>，稳定比什么都重要</li><li><strong>系统和数据一定要分离</strong>，系统挂了数据还在</li><li><strong>配置要备份</strong>，TrueNAS 有导出配置的功能</li></ol><p>好在这次有惊无险，数据都保住了。但折腾了大半天，也是够累的。</p>`,
  },
  {
    slug: "nas-power-consumption",
    title: "折腾日记：为了省电，我给 NAS 做了一次功耗测试",
    date: "2026-06-15",
    excerpt:
      "NAS 一天到底耗多少电？一个月电费多少？用功率计实测给你看，附省电小技巧。",
    tags: ["性能调优", "折腾", "功耗"],
    content: `<p>经常有人问我：NAS 一直开着，电费贵不贵？</p><p>这个问题光靠想是想不出来的，得测。于是我买了个功率计，给我的 NAS 做了一次全面的功耗测试。</p><h2>测试环境</h2><p>先介绍一下我的 NAS 配置：</p><ul><li>CPU：J4125（赛扬四核）</li><li>内存：8G DDR4</li><li>硬盘：2 × 4T 西数红盘 + 128G SSD 系统盘</li><li>主板：ITX 工控板</li><li>电源：120W DC 电源</li></ul><p>典型的入门级家用 NAS 配置。</p><h2>测试结果</h2><table><tr><td>状态</td><td>功率</td></tr><tr><td>待机（啥也不干）</td><td>18W</td></tr><tr><td>文件复制</td><td>28W</td></tr><tr><td>Jellyfin 转码（1080p）</td><td>35W</td></tr><tr><td>硬盘休眠</td><td>10W</td></tr></table><p>一天按平均 20W 算：</p><blockquote>20W × 24h = 0.48 度/天 × 30天 = 14.4 度/月 × 0.5元/度 = 7.2元/月</blockquote><p>一个月七块多，一杯奶茶钱都不到。</p><h2>省电小技巧</h2><p>虽然已经很省了，但折腾的乐趣就在于"能不能更省"。</p><h3>1. CPU 降压</h3><p>支持 C-State 的 CPU 在空闲时会自动降频降压，这部分不用管。但有些主板默认开了高性能模式，可以在 BIOS 里改成节能模式。</p><h3>2. 硬盘休眠</h3><p>不常用的硬盘设置休眠，需要时再唤醒。两块硬盘休眠能省 8-10W。</p><p>但要注意：频繁启停反而伤硬盘，不建议设太短的休眠时间。</p><h3>3. 关闭无用服务</h3><p>不用的服务都关掉，比如不用 FTP 就关了，不用 WebDAV 也关了。每个服务占不了多少，但加起来也有几瓦。</p><h3>4. 换更省电的电源</h3><p>台式机电源在低负载下效率不高，如果是小功率 NAS，换 DC-ATX 或者直插电源能省几瓦。</p><h2>总结</h2><p>家用 NAS 的功耗其实很低，完全不用担心电费问题。与其纠结这点电费，不如想想它给你带来的便利——随时随地看电影、照片自动备份、文件随处访问……</p><p>这钱，花得值。</p>`,
  },
  {
    slug: "photo-backup-syncthing",
    title: "工具推荐：用 Syncthing 做手机照片自动备份，比云盘香多了",
    date: "2026-06-08",
    excerpt:
      "手机照片越来越多，云盘空间不够用？试试 Syncthing，开源免费，自动同步到你的 NAS。",
    tags: ["软件工具", "工具", "备份"],
    content: `<p>手机里的照片越来越多，几个 G 的云空间根本不够用。开会员吧，每年好几百，而且数据在别人服务器上总感觉不太踏实。</p><p>如果你有 NAS，那 Syncthing 就是照片备份的最佳方案。</p><h2>Syncthing 是什么</h2><p>Syncthing 是一个开源的点对点文件同步工具。简单说，就是在你的设备之间直接同步文件，不用经过第三方服务器。</p><h3>特点</h3><ul><li><strong>开源免费</strong>：完全免费，代码开源可审计</li><li><strong>点对点</strong>：设备之间直接同步，速度取决于你的带宽</li><li><strong>加密传输</strong>：全程 TLS 加密，安全</li><li><strong>跨平台</strong>：Windows、Mac、Linux、安卓、NAS 都能用</li></ul><h2>部署方法</h2><h3>1. NAS 端</h3><p>推荐用 Docker 部署：</p><pre><code>docker run -d \\\n  --name syncthing \\\n  -p 8384:8384 \\\n  -p 22000:22000/tcp \\\n  -p 21027:21027/udp \\\n  -v /mnt/tank/backup/phone:/data \\\n  -v syncthing_config:/config \\\n  --restart always \\\n  syncthing/syncthing</code></pre><h3>2. 手机端</h3><p>安卓手机安装 Syncthing-Fork（Google Play 或酷安能搜到）。iOS 目前官方没有客户端，可以用 PhotoSync 之类的替代。</p><h3>3. 配对同步</h3><p>两端都装好后，扫码添加设备，然后选择要同步的文件夹，设置"仅发送"或"仅接收"，就能自动同步了。</p><h2>为什么推荐它</h2><h3>1. 完全自控</h3><p>照片存在自己的 NAS 上，不用担心服务商倒闭、账号封禁、数据泄露。</p><h3>2. 没有容量限制</h3><p>NAS 有多大空间就能存多少，不用为了扩容反复付费。</p><h3>3. 多端同步</h3><p>不止是手机，电脑上的文件也能同步，相当于自建了一个私有云盘。</p><h2>注意事项</h2><ul><li>在外网同步需要两台设备都能联网，建议配合 Tailscale 使用</li><li>可以设置"仅在充电时同步"，避免耗流量和电</li><li>定期检查同步状态，防止哪里断了没发现</li></ul><p>用了 Syncthing 之后，我再也没担心过手机照片的问题——拍了就自动同步到 NAS，省心。</p>`,
  },
  {
    slug: "nas-first-month",
    title: "折腾日记：拥有第一台 NAS 的第一个月，我都干了啥",
    date: "2026-06-01",
    excerpt:
      "从一时冲动下单硬件，到慢慢折腾出自己的数字小窝。记录 NAS 新手第一个月的真实经历。",
    tags: ["灵感碎片", "折腾", "随笔"],
    content: `<p>距离 NAS 组装完成已经一个月了。回想一下，这一个月还挺充实的。</p><h2>第 1 周：兴奋期</h2><p>刚装好那几天，每天下班就坐在电脑前折腾。</p><ul><li>装系统、建存储池、设共享——搞定！</li><li>把电脑里攒了好几年的电影电视剧都拷进去——满满当当！</li><li>装 Jellyfin，刮削海报，看着整整齐齐的海报墙，成就感拉满</li></ul><p>那几天逢人就推荐："整个 NAS 吧，真的香！"</p><h2>第 2 周：折腾期</h2><p>新鲜劲过去之后，开始进入折腾模式：</p><ul><li>觉得默认界面不好看，换主题、改样式</li><li>看论坛说某某容器好用，装了试试，不好用又删掉</li><li>研究远程访问，试了好几种方案</li><li>折腾下载工具，qBittorrent、Aria2、Transmission 挨个试</li></ul><p>这一周 Docker 里的容器装了删、删了装，最后留下的其实就那几个。</p><h2>第 3 周：踩坑期</h2><p>折腾多了，自然就踩坑了：</p><ul><li>权限问题折腾了一下午（前面有写）</li><li>手贱升级系统差点翻车（也写了）</li><li>硬盘咔咔响吓出一身冷汗（还是写了）</li></ul><p>每个坑踩完都感觉自己又进步了一点。</p><h2>第 4 周：沉淀期</h2><p>到了第四周，反而不怎么折腾了。</p><p>NAS 就那样安安静静地跑着，每天自动备份照片、定期拉取更新、定时自检硬盘。我偶尔上去看看状态，大部分时候甚至忘了它的存在。</p><blockquote>好的工具，就是让你感觉不到它的存在。</blockquote><p>但当你需要它的时候——想看某部老电影、想找几年前的照片、想在外面访问家里的文件——它永远都在那里。</p><h2>感受</h2><p>有人说 NAS 是"男生的首饰盒"，我觉得挺对的。它不一定有多实用，但折腾的过程本身就是乐趣。</p><p>而且，当你把各种数据从各个云服务商收回到自己硬盘里的时候，那种踏实感，是云盘给不了的。</p><p>接下来准备折腾什么？可能是虚拟机，可能是软路由，也可能先歇一阵。</p><p>不急，慢慢来。</p>`,
  },
];

async function readPosts(kv: KVNamespace): Promise<Post[]> {
  const raw = await kv.get(POSTS_KEY);
  if (!raw) {
    await kv.put(POSTS_KEY, JSON.stringify(DEFAULT_POSTS));
    return DEFAULT_POSTS;
  }
  return JSON.parse(raw);
}

async function writePosts(kv: KVNamespace, posts: Post[]): Promise<void> {
  await kv.put(POSTS_KEY, JSON.stringify(posts));
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 80) || String(Date.now());
}
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
  let users: User[];
  if (!raw) {
    users = [
      {
        id: "1",
        username: "admin",
        email: "admin@shiguang.dev",
        password: "admin",
        role: "admin",
      },
    ];
    await kv.put(USERS_KEY, JSON.stringify(users));
    return users;
  }
  users = JSON.parse(raw);
  const adminUser = users.find(u => u.username === "admin");
  if (!adminUser) {
    users.push({
      id: String(Date.now()),
      username: "admin",
      email: "admin@shiguang.dev",
      password: "admin",
      role: "admin",
    });
    await kv.put(USERS_KEY, JSON.stringify(users));
  }
  return users;
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
        from: { email: env.MAIL_FROM, name: env.MAIL_FROM_NAME || "那斯小棧" },
        subject: "那斯小棧 - 密码重置验证码",
        content: [
          {
            type: "text/html",
            value: `
              <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
                <h2 style="color: #10b981;">那斯小棧</h2>
                <p>您正在进行密码重置操作，验证码如下：</p>
                <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #10b981; margin: 24px 0;">${code}</div>
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

    // 重置管理员密码（用于恢复访问）
    if (path === "/api/reset-admin" && method === "GET") {
      const users = await readUsers(env.USERS_KV);
      const adminIndex = users.findIndex(u => u.username === "admin");
      if (adminIndex !== -1) {
        users[adminIndex].password = "admin";
      } else {
        users.push({
          id: String(Date.now()),
          username: "admin",
          email: "admin@shiguang.dev",
          password: "admin",
          role: "admin",
        });
      }
      await writeUsers(env.USERS_KV, users);
      return jsonResponse({ success: true, message: "管理员密码已重置为 admin" });
    }

    // 重置文章为默认数据
    if (path === "/api/reset-posts" && method === "GET") {
      await env.USERS_KV.put(POSTS_KEY, JSON.stringify(DEFAULT_POSTS));
      return jsonResponse({ success: true, message: "文章已重置为默认数据", count: DEFAULT_POSTS.length });
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

    // 上传图片到 R2
    if (path === "/api/upload/image" && method === "POST") {
      const contentType = request.headers.get("content-type") || "";
      if (!contentType.includes("multipart/form-data")) {
        return jsonResponse({ success: false, message: "Content-Type 必须是 multipart/form-data" }, 400);
      }

      const formData = await request.formData();
      const file = formData.get("file");
      if (!file || !(file instanceof File)) {
        return jsonResponse({ success: false, message: "请选择要上传的图片文件" }, 400);
      }

      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        return jsonResponse({ success: false, message: "图片大小不能超过 5MB" }, 400);
      }

      const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
      if (!allowedTypes.includes(file.type)) {
        return jsonResponse({ success: false, message: "只支持 JPG、PNG、GIF、WebP、SVG 格式" }, 400);
      }

      const ext = file.type.split("/")[1]?.replace("svg+xml", "svg") || "jpg";
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 10);
      const key = `uploads/${timestamp}-${random}.${ext}`;

      const buffer = await file.arrayBuffer();
      await env.IMAGES_BUCKET.put(key, buffer, {
        httpMetadata: {
          contentType: file.type,
          cacheControl: "public, max-age=31536000",
        },
      });

      const cdnUrl = env.IMAGE_CDN_URL || "";
      const url = `${cdnUrl}/${key}`;

      return jsonResponse({
        success: true,
        url,
        key,
      });
    }

    // 获取站点设置
    if (path === "/api/site-settings" && method === "GET") {
      const raw = await env.USERS_KV.get(SITE_SETTINGS_KEY);
      const settings: SiteSettings = raw
        ? JSON.parse(raw)
        : { title: "那斯小棧", description: "在代码与硬盘的缝隙里，记录每一次 NAS 折腾的踩坑与顿悟。" };
      return jsonResponse({ success: true, settings });
    }

    // 保存站点设置
    if (path === "/api/site-settings" && method === "POST") {
      const { title, description } = await request.json();
      if (!title || !title.trim()) {
        return jsonResponse({ success: false, message: "站点标题不能为空" }, 400);
      }
      const settings: SiteSettings = { title: title.trim(), description: (description || "").trim() };
      await env.USERS_KV.put(SITE_SETTINGS_KEY, JSON.stringify(settings));
      return jsonResponse({ success: true, settings });
    }

    // 获取文章列表
    if (path === "/api/posts" && method === "GET") {
      const posts = await readPosts(env.USERS_KV);
      const sorted = [...posts].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      return jsonResponse({ success: true, posts: sorted });
    }

    // 获取单篇文章
    const postDetailMatch = path.match(/^\/api\/posts\/([^/]+)$/);
    if (postDetailMatch && method === "GET") {
      const slug = decodeURIComponent(postDetailMatch[1]);
      const posts = await readPosts(env.USERS_KV);
      const post = posts.find((p) => p.slug === slug);
      if (post) {
        return jsonResponse({ success: true, post });
      }
      return jsonResponse({ success: false, message: "文章不存在" }, 404);
    }

    // 创建文章
    if (path === "/api/posts" && method === "POST") {
      const { title, date, excerpt, content, tags, featured } = await request.json();
      if (!title || !title.trim()) {
        return jsonResponse({ success: false, message: "文章标题不能为空" }, 400);
      }
      if (!excerpt || !excerpt.trim()) {
        return jsonResponse({ success: false, message: "文章摘要不能为空" }, 400);
      }
      if (!content || !content.trim()) {
        return jsonResponse({ success: false, message: "文章内容不能为空" }, 400);
      }
      const posts = await readPosts(env.USERS_KV);
      let slug = slugify(title.trim());
      let counter = 1;
      while (posts.some((p) => p.slug === slug)) {
        slug = `${slugify(title.trim())}-${counter}`;
        counter++;
      }
      const newPost: Post = {
        slug,
        title: title.trim(),
        date: date || new Date().toISOString().split("T")[0],
        excerpt: excerpt.trim(),
        content,
        tags: Array.isArray(tags) ? tags : [],
        featured: !!featured,
      };
      posts.push(newPost);
      await writePosts(env.USERS_KV, posts);
      return jsonResponse({ success: true, post: newPost });
    }

    // 更新文章
    const postUpdateMatch = path.match(/^\/api\/posts\/([^/]+)$/);
    if (postUpdateMatch && method === "PUT") {
      const slug = decodeURIComponent(postUpdateMatch[1]);
      const { title, date, excerpt, content, tags, featured } = await request.json();
      const posts = await readPosts(env.USERS_KV);
      const index = posts.findIndex((p) => p.slug === slug);
      if (index === -1) {
        return jsonResponse({ success: false, message: "文章不存在" }, 404);
      }
      posts[index] = {
        ...posts[index],
        title: title?.trim() ?? posts[index].title,
        date: date ?? posts[index].date,
        excerpt: excerpt?.trim() ?? posts[index].excerpt,
        content: content ?? posts[index].content,
        tags: Array.isArray(tags) ? tags : posts[index].tags,
        featured: featured !== undefined ? !!featured : posts[index].featured,
      };
      await writePosts(env.USERS_KV, posts);
      return jsonResponse({ success: true, post: posts[index] });
    }

    // 删除文章
    const postDeleteMatch = path.match(/^\/api\/posts\/([^/]+)$/);
    if (postDeleteMatch && method === "DELETE") {
      const slug = decodeURIComponent(postDeleteMatch[1]);
      const posts = await readPosts(env.USERS_KV);
      const filtered = posts.filter((p) => p.slug !== slug);
      if (filtered.length === posts.length) {
        return jsonResponse({ success: false, message: "文章不存在" }, 404);
      }
      await writePosts(env.USERS_KV, filtered);
      return jsonResponse({ success: true });
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
