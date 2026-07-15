import { ReactNode } from "react";
import Sidebar from "@/components/Sidebar";

// 双栏编辑式布局：左侧内容 + 右侧 240px 侧边栏，移动端堆叠
export default function TwoColumn({
  children,
  sidebar = <Sidebar />,
}: {
  children: ReactNode;
  sidebar?: ReactNode;
}) {
  return (
    <div className="max-w-6xl mx-auto px-6 py-8 lg:py-10 grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-8 lg:gap-10">
      <div className="flex flex-col gap-0 min-w-0">{children}</div>
      {sidebar}
    </div>
  );
}
