export interface Category {
  slug: string;
  name: string;
  description: string;
  tags: string[];
}

export const categories: Category[] = [
  {
    slug: "tutorial",
    name: "教程系列",
    description: "面向不同阶段读者的系统化 NAS 教程，从入门到进阶，一步步搭建你的私有云。",
    tags: ["入门指南", "进阶实战", "场景方案", "TrueNAS", "Unraid", "群晖", "Docker", "教程"],
  },
  {
    slug: "pitfall",
    name: "踩坑实录",
    description: "真实记录折腾路上遇到的各种坑与解决方案——报错排查、硬件翻车、系统崩\\u0002溃，全在这里。",
    tags: ["报错排查", "硬件踩坑", "系统踩坑", "踩坑", "排查"],
  },
  {
    slug: "tools",
    name: "工具推荐",
    description: "精选 NAS 生态中的优质工具——好用的 Docker 容器、管理工具、硬件清单。",
    tags: ["Docker", "软件工具", "硬件清单", "工具", "容器"],
  },
  {
    slug: "diary",
    name: "折腾日记",
    description: "轻松随性的日常记录——版本更新、性能调优、灵感碎片，一个真实在折腾的人。",
    tags: ["版本更新", "性能调优", "灵感碎片", "日记", "随笔", "折腾"],
  },
];

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}
