// Mock 文章数据与数据访问函数

export interface Post {
  slug: string;
  title: string;
  date: string; // YYYY-MM-DD
  excerpt: string;
  content: string; // 含简单 HTML 标记
  tags: string[];
  featured?: boolean;
}

const posts: Post[] = [
  {
    slug: "between-code-and-words",
    title: "在代码与文字之间",
    date: "2026-07-10",
    excerpt:
      "有时候我觉得编程和写作有很多相似之处——它们都需要在混乱中寻找秩序，在简洁中表达复杂。这篇文章记录了我对这两件事的一些思考。",
    featured: true,
    tags: ["随笔", "代码", "生活"],
    content: `
<p>有时候我觉得编程和写作有很多相似之处——它们都需要在混乱中寻找秩序，在简洁中表达复杂。</p>
<p>写下一行代码和写下一个句子，本质上都是一次"选择"：在无数种可能的表达里，挑出最合适的那一种。一个函数命名和一个动词的选用，遵循着相似的审美——准确、克制、不卖弄。</p>
<h2>秩序从约束中来</h2>
<p>好的代码和好的文章，都懂得自我设限。变量的作用域、函数的职责，与段落的主题、句子的主语，其实是一回事：把合适的东西，放在合适的位置。</p>
<blockquote>简洁不是少，而是没有多余。</blockquote>
<p>当我们在重构一段代码时，删去的每一行都让剩下的代码更清晰地表达意图。这与编辑文稿时删去每一个冗余的形容词，是同一种愉悦。</p>
<h2>留给读者的空间</h2>
<p>无论是代码还是文字，最终的读者都不是自己。优秀的工程师会为后来者留下清晰的路径，优秀的写作者会为读者留下想象的空间。</p>
<ul>
<li>注释解释"为什么"，而不是"是什么"</li>
<li>段落之间留有呼吸的余地</li>
<li>命名比注释更重要，标题比正文更难写</li>
</ul>
<p>所以，在代码与文字之间，我找到了同一种安静的力量。</p>
`,
  },
  {
    slug: "design-system-subtraction",
    title: "设计系统的减法哲学",
    date: "2026-07-05",
    excerpt:
      "好的设计系统不是加法，而是精准的减法。去掉不必要的选项，留下真正有意义的决策。",
    tags: ["设计"],
    content: `
<p>好的设计系统不是加法，而是精准的减法。去掉不必要的选项，留下真正有意义的决策。</p>
<h2>选项越多，决策越慢</h2>
<p>当一个设计系统提供了十种间距、八种圆角、五种主色，团队的实际使用往往会发散。真正成熟的系统，会主动收缩选择范围，让"正确的做法"成为"唯一的做法"。</p>
<blockquote>约束孕育创造力，而非扼杀它。</blockquote>
<h2>从原子到模式</h2>
<p>减法不是简单地删减，而是把高频组合沉淀为模式。一个被反复使用的卡片结构，应该成为一个组件，而不是每次重新拼装。</p>
<ul>
<li>颜色：1 个主色 + 1 个中性灰阶</li>
<li>间距：基于 4px 的等差数列</li>
<li>圆角：3 个层级足够</li>
</ul>
<p>做减法的勇气，来自对"够用"的信任。</p>
`,
  },
  {
    slug: "typecho-theme-notes",
    title: "Typecho 主题开发手记",
    date: "2026-06-28",
    excerpt:
      "记录了从零开始为 Typecho 开发自定义主题的过程，包括模板结构和样式设计。",
    tags: ["Typecho", "代码"],
    content: `
<p>记录了从零开始为 Typecho 开发自定义主题的过程，包括模板结构和样式设计。</p>
<h2>模板结构</h2>
<p>Typecho 的主题由一组 PHP 模板组成，核心文件包括 <code>index.php</code>、<code>post.php</code>、<code>page.php</code> 和 <code>functions.php</code>。理解每个模板的渲染时机，是组织代码的第一步。</p>
<pre><code>// functions.php 中注册主题配置
function themeConfig($form) {
  $logo = new Typecho_Widget_Helper_Form_Element_Text(
    'logo', null, null, _t('站点 LOGO'), _t('在这里填写 LOGO 地址')
  );
  $form->addInput($logo);
}</code></pre>
<h2>样式取舍</h2>
<p>我倾向于用 CSS 变量管理主题令牌，这样切换暗色模式只需替换变量值，而不是重写整套样式。</p>
<blockquote>主题的个性，往往体现在排版的克制里。</blockquote>
<p>最终这个主题用了衬线标题 + 无衬线正文，配合一个温暖的赤陶土强调色，呈现出"编辑式"的阅读氛围。</p>
`,
  },
  {
    slug: "reading-design-of-design",
    title: "读书笔记：设计中的设计",
    date: "2026-06-20",
    excerpt: "原研哉的设计理念让我重新思考了“简洁”的含义。",
    tags: ["阅读", "设计"],
    content: `
<p>原研哉的设计理念让我重新思考了"简洁"的含义。</p>
<h2>虚空的价值</h2>
<p>他在《设计中的设计》里反复强调"空"的概念——一个容器之所以有用，是因为它内部的空。设计不是把东西填满，而是为使用者的想象留出余地。</p>
<blockquote>设计就是把日常陌生化，再重新认识它。</blockquote>
<h2>RE-DESIGN</h2>
<p>重新设计一卷卫生纸、一根火柴，这种"回到原点"的练习，让人意识到那些被我们习以为常的物品，其实都蕴含着可被优化的细节。</p>
<ul>
<li>方形的卷纸会传达"节约"的阻力感</li>
<li>火柴的枝丫形态保留了自然的痕迹</li>
</ul>
<p>读完这本书，我开始用更慢的眼光，打量身边的每一件东西。</p>
`,
  },
  {
    slug: "summer-coffee-keyboard",
    title: "夏日的咖啡与键盘",
    date: "2026-06-15",
    excerpt: "一个关于远程工作、咖啡馆和创作节奏的小故事。",
    tags: ["生活", "随笔"],
    content: `
<p>一个关于远程工作、咖啡馆和创作节奏的小故事。</p>
<p>这个夏天，我把办公室搬到了街角的一家咖啡馆。吧台后面那台老式磨豆机的声音，成了我进入心流的开关。</p>
<h2>节奏感</h2>
<p>远程工作最大的挑战不是自律，而是节奏。咖啡馆的白噪音替我划定了工作的边界——一杯咖啡喝完之前，专注；喝完之后，可以短暂地走神。</p>
<blockquote>好的节奏，是张弛之间的呼吸。</blockquote>
<p>键盘的敲击声和咖啡机的蒸汽声交织在一起，构成了一种奇异的和谐。我在这里写下了一半的代码，和一大半的文字。</p>
<p>也许，创作的秘密就藏在这些日常的仪式里。</p>
`,
  },
  {
    slug: "css-grid-in-practice",
    title: "CSS Grid 实战技巧",
    date: "2026-06-08",
    excerpt: "几个在实际项目中特别有用的 CSS Grid 布局模式。",
    tags: ["CSS", "代码"],
    content: `
<p>几个在实际项目中特别有用的 CSS Grid 布局模式。</p>
<h2>圣杯布局的优雅解法</h2>
<p>用 Grid 实现经典的"内容 + 侧边栏"双栏布局，比 Flex 更直观，只需一行 <code>grid-template-columns</code>。</p>
<pre><code>.layout {
  display: grid;
  grid-template-columns: 1fr 240px;
  gap: 40px;
}</code></pre>
<h2>响应式无需媒体查询</h2>
<p>利用 <code>minmax()</code> 和 <code>auto-fit</code>，可以让卡片网格在不同屏幕宽度下自动重排，而无需写一堆断点。</p>
<pre><code>.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
}</code></pre>
<blockquote>把布局的复杂度交给浏览器，把注意力留给内容。</blockquote>
<ul>
<li><code>1fr</code> 比 <code>%</code> 更适合分配剩余空间</li>
<li><code>subgrid</code> 让嵌套对齐变得简单</li>
</ul>
<p>掌握 Grid 之后，很多过去需要 float 和 hack 的布局，都变得自然而然。</p>
`,
  },
  {
    slug: "slow-reading-in-fragments",
    title: "碎片时代的慢阅读",
    date: "2026-05-22",
    excerpt:
      "在信息流不断刷新的时代，如何重新找回深度阅读的能力？这是一些来自实践的方法。",
    tags: ["阅读", "随笔"],
    content: `
<p>在信息流不断刷新的时代，如何重新找回深度阅读的能力？这是一些来自实践的方法。</p>
<h2>把书拆成可读的单元</h2>
<p>长篇并不可怕，可怕的是把它当作一个不可分割的整体。把一本书拆成若干个 20 分钟的阅读单元，反而更容易坚持。</p>
<blockquote>阅读不是为了读完，而是为了读进去。</blockquote>
<ul>
<li>固定时间与场景，建立仪式感</li>
<li>用纸笔做批注，让思考留下痕迹</li>
<li>读完后合上书，复述给自己听</li>
</ul>
<p>慢，是抵抗碎片化最温柔的方式。</p>
`,
  },
  {
    slug: "refactor-with-confidence",
    title: "带着信心去重构",
    date: "2026-05-09",
    excerpt:
      "重构不是冒险，而是一种有节奏的改进。如何在不确定中建立对代码的信心，是这篇文章的主题。",
    tags: ["代码"],
    content: `
<p>重构不是冒险，而是一种有节奏的改进。如何在不确定中建立对代码的信心，是这篇文章的主题。</p>
<h2>小步快走</h2>
<p>每一次重构都应该小到"如果出错，立刻能发现"。把大改动拆成一系列可验证的小步骤，是安全重构的前提。</p>
<pre><code>// 提取函数前：先保证行为不变
// 提取函数后：再优化实现</code></pre>
<blockquote>先让它对，再让它好。</blockquote>
<p>测试是信心的来源。哪怕只是覆盖核心路径的几个用例，也能让重构从"赌博"变成"工程"。</p>
<ul>
<li>红-绿-重构的循环</li>
<li>提交粒度等于回滚粒度</li>
<li>重构与功能修改不要混在一次提交</li>
</ul>
<p>带着信心去重构，代码会慢慢长成它该有的样子。</p>
`,
  },
];

// ── 数据访问函数 ──

export function getAllPosts(): Post[] {
  return [...posts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export function getFeaturedPost(): Post | undefined {
  return posts.find((p) => p.featured);
}

export function getNonFeaturedPosts(): Post[] {
  return getAllPosts().filter((p) => !p.featured);
}

export function getPostBySlug(slug: string): Post | undefined {
  return posts.find((p) => p.slug === slug);
}

export function getAdjacentPosts(
  slug: string
): { prev: Post | undefined; next: Post | undefined } {
  const sorted = getAllPosts();
  const index = sorted.findIndex((p) => p.slug === slug);
  // 列表按日期倒序：index-1 为更新一篇（next），index+1 为更旧一篇（prev）
  return {
    next: index > 0 ? sorted[index - 1] : undefined,
    prev: index >= 0 && index < sorted.length - 1 ? sorted[index + 1] : undefined,
  };
}

export function getPostsByTag(tag: string): Post[] {
  return getAllPosts().filter((p) => p.tags.includes(tag));
}

export function getAllTags(): string[] {
  const tagSet = new Set<string>();
  posts.forEach((p) => p.tags.forEach((t) => tagSet.add(t)));
  return Array.from(tagSet);
}

export function searchPosts(keyword: string): Post[] {
  const k = keyword.trim().toLowerCase();
  if (!k) return [];
  return getAllPosts().filter((p) =>
    [p.title, p.excerpt, p.content]
      .join(" ")
      .toLowerCase()
      .includes(k)
  );
}

export interface ArchiveGroup {
  year: number;
  month: number;
  posts: Post[];
}

export function getArchives(): ArchiveGroup[] {
  const sorted = getAllPosts();
  const groups: Record<string, ArchiveGroup> = {};
  sorted.forEach((p) => {
    const d = new Date(p.date);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    if (!groups[key]) {
      groups[key] = {
        year: d.getFullYear(),
        month: d.getMonth() + 1,
        posts: [],
      };
    }
    groups[key].posts.push(p);
  });
  return Object.values(groups).sort(
    (a, b) =>
      new Date(b.year, b.month - 1).getTime() -
      new Date(a.year, a.month - 1).getTime()
  );
}

// ── 日期格式化工具 ──

export function formatLongDate(date: string): string {
  const d = new Date(date);
  return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日`;
}

export function formatShortDate(date: string): string {
  const d = new Date(date);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

export function formatYearMonth(year: number, month: number): string {
  return `${year} 年 ${month} 月`;
}
