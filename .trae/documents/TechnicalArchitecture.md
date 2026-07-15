# 技术架构文档 - 拾光笔记博客

## 1. 架构设计
纯前端单页应用（SPA），无后端服务；文章数据以 Mock 数据形式内置于前端，通过 React Router 进行页面切换，主题（亮/暗）通过 Context 全局管理并持久化到 localStorage。

```mermaid
flowchart TD
    subgraph "前端层 React SPA"
        "路由层 React Router" --> "页面层 Pages"
        "页面层 Pages" --> "组件层 Components"
        "组件层 Components" --> "状态层 Context ThemeContext"
    end
    subgraph "数据层"
        "Mock 数据 posts.js" --> "组件层 Components"
        "localStorage 主题偏好" --> "状态层 Context ThemeContext"
    end
```

## 2. 技术说明
- 前端：React@18 + TailwindCSS@3 + Vite
- 初始化工具：Vite（vite create react 模板）
- 路由：react-router-dom@6
- 图标：lucide-react
- 字体：Google Fonts（Playfair Display、Noto Serif SC、Inter、Noto Sans SC）
- 后端：无
- 数据库：无，使用内置 Mock 数据

## 3. 路由定义
| 路由 | 用途 |
|------|------|
| `/` | 首页：置顶精选 + 文章列表 + 侧边栏 |
| `/post/:slug` | 文章详情页：正文排版 + 上下篇导航 |
| `/archives` | 归档页：按时间线分组的文章 |
| `/about` | 关于页：作者介绍 |
| `/tag/:tag` | 标签筛选结果页：该标签下文章列表 |
| `/search?q=关键词` | 搜索结果页：关键词匹配文章 |

## 4. API 定义
无后端 API。前端数据层提供以下纯函数（src/data/posts.js）：
- `getAllPosts()`：返回全部文章数组
- `getPostBySlug(slug)`：按 slug 获取单篇
- `getAdjacentPosts(slug)`：返回 { prev, next }
- `getPostsByTag(tag)`：按标签筛选
- `searchPosts(keyword)`：关键词搜索（标题+摘要+正文）
- `getArchives()`：按 {year, month} 分组返回

文章数据结构（TypeScript 描述）：
```ts
interface Post {
  slug: string;          // URL 标识
  title: string;         // 标题
  date: string;          // ISO 日期 YYYY-MM-DD
  excerpt: string;       // 摘要
  content: string;       // 正文（含简单 HTML 标记）
  tags: string[];        // 标签
  featured?: boolean;    // 是否置顶精选
}
```

## 5. 服务端架构图
不适用（无后端）。

## 6. 数据模型
不适用（无数据库，使用 Mock 数据）。

## 7. 项目结构
```
src/
├── main.jsx                # 入口，挂载 Router 与 ThemeProvider
├── App.jsx                 # 路由表 + Layout
├── index.css               # 全局样式 + Tailwind + 设计令牌 CSS 变量
├── context/
│   └── ThemeContext.jsx    # 亮/暗主题 Context + localStorage 持久化
├── data/
│   └── posts.js            # Mock 文章数据 + 数据访问函数
├── components/
│   ├── Header.jsx          # 顶栏：站点标题 + 导航 + 主题切换
│   ├── Footer.jsx          # 页脚
│   ├── Sidebar.jsx         # 右侧栏：作者卡+搜索+导航+标签云
│   ├── FeaturedPost.jsx    # 置顶精选卡片
│   ├── ArticleListItem.jsx # 文章列表条目
│   └── Layout.jsx          # 整体布局（Header+Outlet+Footer）
└── pages/
    ├── Home.jsx            # 首页
    ├── ArticleDetail.jsx   # 文章详情
    ├── Archives.jsx        # 归档
    ├── About.jsx           # 关于
    ├── TagResults.jsx      # 标签筛选结果
    └── SearchResults.jsx   # 搜索结果
```

## 8. 设计令牌（与设计稿严格一致）
亮色：
- background #faf8f5 / foreground #2c2c2c / card #ffffff
- primary #c2703e / primary-foreground #ffffff
- muted #a8a29e / muted-foreground #57534e / border #e7e5e4

暗色：
- background #1a1917 / foreground #e7e5e4 / card #262523
- primary #d4885a / muted #78716c / muted-foreground #a8a29e / border #3d3a37

字体：
- display: "Playfair Display","Noto Serif SC",Georgia,serif
- body: "Inter","Noto Sans SC",-apple-system,"Segoe UI",sans-serif
- mono: "JetBrains Mono","Fira Code",monospace

圆角：sm 4px / md 8px / lg 12px

## 9. 响应式断点
- ≥1024px：双栏 grid 1fr 240px，gap 40px
- 768-1023px：双栏 grid 1fr 220px，gap 32px，内边距缩小
- <768px：单栏，侧边栏移至内容下方，顶栏导航紧凑横排
