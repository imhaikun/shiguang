import fs from 'fs';

const posts = JSON.parse(fs.readFileSync('./server/db/posts.json', 'utf-8'));

const categoryRules = [
  { slug: 'tutorial', tags: ['教程', '入门指南', '进阶实战'] },
  { slug: 'troubleshoot', tags: ['踩坑', '报错排查', '踩坑实录'] },
  { slug: 'tools', tags: ['工具', '软件工具'] },
  { slug: 'diary', tags: ['折腾', '场景方案', '硬件踩坑'] },
];

let assignedCount = 0;
posts.forEach(post => {
  if (!post.category) {
    for (const rule of categoryRules) {
      if (post.tags.some(tag => rule.tags.includes(tag))) {
        post.category = rule.slug;
        assignedCount++;
        break;
      }
    }
  }
});

console.log(`已为 ${assignedCount} 篇文章分配分类`);

posts.forEach(post => {
  console.log(`${post.title} -> ${post.category || '未分类'}`);
});

fs.writeFileSync('./server/db/posts.json', JSON.stringify(posts, null, 2), 'utf-8');
console.log('\n分类已保存到 posts.json');

console.log('\n分类统计：');
const catCount = {};
posts.forEach(post => {
  const cat = post.category || '未分类';
  catCount[cat] = (catCount[cat] || 0) + 1;
});
Object.entries(catCount).forEach(([cat, count]) => {
  console.log(`${cat}: ${count} 篇`);
});