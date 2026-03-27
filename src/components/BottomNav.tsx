"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CreditCard,
  Plus,
  Wallet,
  Settings,
} from "lucide-react";

const LEFT_ITEMS = [
  { href: "/dashboard", label: "홈", icon: LayoutDashboard },
  { href: "/subscriptions", label: "구독", icon: CreditCard },
];

const RIGHT_ITEMS = [
  { href: "/budget", label: "가계부", icon: Wallet },
  { href: "/settings", label: "설정", icon: Settings },
];

interface BottomNavProps {
  onQuickAdd?: () => void;
}

export default function BottomNav({ onQuickAdd }: BottomNavProps) {
  const pathname = usePathname();

  const renderItem = ({ href, label, icon: Icon }: typeof LEFT_ITEMS[0]) => {
    const active = pathname.startsWith(href);
    return (
      <Link
        key={href}
        href={href}
        className={`flex flex-col items-center justify-center gap-0.5 px-3 py-2.5 min-w-[48px] min-h-[44px] pressable ${
          active ? "text-accent" : "text-text-tertiary"
        }`}
      >
        <Icon size={22} strokeWidth={active ? 2.4 : 1.6} />
        <span
          className={`text-[11px] leading-tight ${
            active ? "font-semibold" : "font-normal"
          }`}
        >
          {label}
        </span>
      </Link>
    );
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-bg-card/80 backdrop-blur-xl border-t border-border safe-bottom">
      <div className="max-w-lg mx-auto flex items-center justify-around h-[56px] relative">
        {LEFT_ITEMS.map(renderItem)}

        {/* Center + Button */}
        <button
          onClick={onQuickAdd}
          className="flex items-center justify-center w-[48px] h-[48px] -mt-5 bg-accent rounded-full shadow-lg pressable hover:bg-accent-hover transition-colors border-4 border-bg-card"
        >
          <Plus size={22} className="text-white" strokeWidth={2.5} />
        </button>

        {RIGHT_ITEMS.map(renderItem)}
      </div>
    </nav>
  );
}
