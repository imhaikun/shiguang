import fs from 'fs';

const posts = JSON.parse(fs.readFileSync('./server/db/posts.json', 'utf-8'));

posts.forEach(post => {
  const catMap = {
    tutorial: '教程系列',
    troubleshoot: '踩坑实录',
    tools: '工具推荐',
    diary: '折腾日记'
  };
  console.log(`${post.slug}: ${post.category || '未分类'} (${catMap[post.category] || ''})`);
});

console.log('\nTotal posts:', posts.length);
console.log('Posts with category:', posts.filter(p => p.category).length);

const categories = [
  { id: "1", name: "教程系列", slug: "tutorial", description: "详细的技术教程", createdAt: Date.now(), updatedAt: Date.now() },
  { id: "2", name: "踩坑实录", slug: "troubleshoot", description: "遇到的问题和解决方案", createdAt: Date.now(), updatedAt: Date.now() },
  { id: "3", name: "工具推荐", slug: "tools", description: "好用的工具推荐", createdAt: Date.now(), updatedAt: Date.now() },
  { id: "4", name: "折腾日记", slug: "diary", description: "日常折腾记录", createdAt: Date.now(), updatedAt: Date.now() },
];

console.log('\nCategories:', JSON.stringify(categories, null, 2));

fs.writeFileSync('./server/worker_defaults.json', JSON.stringify({ posts, categories }, null, 2), 'utf-8');
console.log('\nSaved to worker_defaults.json');