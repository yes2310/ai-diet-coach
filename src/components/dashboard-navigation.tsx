"use client";

import clsx from "clsx";
import {
  BarChart3,
  Camera,
  ChefHat,
  Home,
  Settings,
} from "lucide-react";
import type { ComponentType } from "react";

export type TabId = "home" | "meals" | "photo" | "analysis" | "profile";

const tabs: readonly {
  readonly id: TabId;
  readonly label: string;
  readonly icon: ComponentType<{ readonly className?: string }>;
}[] = [
  { id: "home", label: "홈", icon: Home },
  { id: "meals", label: "기록", icon: ChefHat },
  { id: "photo", label: "사진", icon: Camera },
  { id: "analysis", label: "분석", icon: BarChart3 },
  { id: "profile", label: "내 정보", icon: Settings },
];

export function DesktopDashboardNavigation({
  activeTab,
  userName,
  onSelect,
}: {
  readonly activeTab: TabId;
  readonly userName: string;
  readonly onSelect: (tab: TabId) => void;
}) {
  return (
    <aside className="hidden border-r border-[var(--line)] bg-white/80 px-4 py-6 lg:block">
      <div className="mb-8">
        <p className="text-sm font-semibold text-blue-700">AI 식단 분석</p>
        <p className="mt-2 text-sm text-zinc-500">{userName}</p>
      </div>
      <nav className="space-y-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelect(tab.id)}
              className={clsx(
                "flex h-11 w-full items-center gap-3 rounded-md px-3 text-sm font-medium transition",
                activeTab === tab.id
                  ? "bg-zinc-950 text-white"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950",
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {tab.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

export function MobileDashboardNavigation({
  activeTab,
  onSelect,
}: {
  readonly activeTab: TabId;
  readonly onSelect: (tab: TabId) => void;
}) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--line)] bg-white px-2 pb-[env(safe-area-inset-bottom)] lg:hidden">
      <div className="mx-auto grid h-16 max-w-md grid-cols-5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelect(tab.id)}
              className={clsx(
                "flex flex-col items-center justify-center gap-1 text-xs font-medium",
                activeTab === tab.id ? "text-blue-700" : "text-zinc-500",
              )}
            >
              <Icon className="h-5 w-5" aria-hidden />
              {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
