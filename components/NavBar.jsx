import Link from "next/link";
import {
  Home,
  Search,
  Mail,
  CheckSquare,
  MessageSquare,
  SunMoon,
} from "lucide-react";
import { motion } from "framer-motion";

export default function NavBar({ theme, toggleTheme }) {
  const items = [
    { href: "/", icon: Home, label: "" },
    { href: "/search", icon: Search, label: "Search" },
    { href: "/extract", icon: Mail, label: "Email" },
    { href: "/validate", icon: CheckSquare, label: "Email Valid" },
    { href: "/whatsapp", icon: MessageSquare, label: "WhatsApp" },
  ];

  return (
    <motion.nav
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-5 right-[30%] transform  z-50"
    >
      <div className="backdrop-blur-md bg-white/8 dark:bg-black/40 border border-white/10 dark:border-white/6 rounded-3xl px-4 py-2 flex items-center gap-3 shadow-lg">
        {items.map((it, i) => {
          const Icon = it.icon;
          return (
            <Link
              key={i}
              href={it.href}
              className="flex flex-col items-center text-sm px-3 py-1 hover:scale-105 transition-transform"
            >
              <Icon className="w-5 h-5" />
              {it.label && <span className="mt-1">{it.label}</span>}
            </Link>
          );
        })}
        <button
          onClick={toggleTheme}
          className="ml-2 p-2 rounded-lg hover:scale-105 transition"
        >
          <SunMoon className="w-5 h-5" />
        </button>
      </div>
    </motion.nav>
  );
}
