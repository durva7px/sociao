// Small line icons matching the mockups. Decorative: buttons carry their own labels.

const base = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function HeartIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg {...base} fill={filled ? "#e5484d" : "none"} stroke={filled ? "#e5484d" : "currentColor"}>
      <path d="M12 20s-7-4.4-9.2-8.6C1.2 8.2 3 4.5 6.6 4.5c2 0 3.5 1.1 4.4 2.6.9-1.5 2.4-2.6 4.4-2.6 3.6 0 5.4 3.7 3.8 6.9C19 15.6 12 20 12 20Z" />
    </svg>
  );
}

export function CommentIcon() {
  return (
    <svg {...base}>
      <path d="M4 5h16v11H9l-5 4V5Z" />
    </svg>
  );
}

export function ShareIcon() {
  return (
    <svg {...base}>
      <path d="M21 3 10 14" />
      <path d="M21 3 14 21l-4-7-7-4 18-7Z" />
    </svg>
  );
}

export function BookmarkIcon() {
  return (
    <svg {...base}>
      <path d="M6 3h12v18l-6-4-6 4V3Z" />
    </svg>
  );
}

export function MoreIcon() {
  return (
    <svg {...base}>
      <circle cx="6" cy="12" r="1" fill="currentColor" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
      <circle cx="18" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}

export function BellIcon() {
  return (
    <svg {...base}>
      <path d="M6 9a6 6 0 1 1 12 0c0 6 2 7 2 7H4s2-1 2-7Z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  );
}

export function ChatIcon() {
  return (
    <svg {...base}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="8" cy="12" r="0.8" fill="currentColor" />
      <circle cx="12" cy="12" r="0.8" fill="currentColor" />
      <circle cx="16" cy="12" r="0.8" fill="currentColor" />
    </svg>
  );
}

export function LogoutIcon() {
  return (
    <svg {...base}>
      <path d="M10 4H5v16h5" />
      <path d="M14 8l4 4-4 4" />
      <path d="M18 12H9" />
    </svg>
  );
}

export function HomeIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg {...base} width={24} height={24} fill={filled ? "currentColor" : "none"}>
      <path d="M4 10.5 12 4l8 6.5V20H4v-9.5Z" />
      <path d="M12 15v3" stroke={filled ? "#fff" : "currentColor"} />
    </svg>
  );
}

export function VideoIcon() {
  return (
    <svg {...base} width={24} height={24}>
      <path d="M12 3 20 7.5v9L12 21l-8-4.5v-9L12 3Z" />
      <path d="M10.5 9.5v5l4-2.5-4-2.5Z" />
    </svg>
  );
}

export function PlusIcon() {
  return (
    <svg {...base} width={22} height={22} strokeWidth={2}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function InboxIcon() {
  return (
    <svg {...base} width={24} height={24}>
      <path d="M5 4h14v12H10l-5 4V4Z" />
      <path d="M9 10h6" />
    </svg>
  );
}

export function ProfileIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg {...base} width={24} height={24}>
      <circle cx="12" cy="12" r="9" fill={filled ? "currentColor" : "none"} />
      <circle cx="12" cy="10" r="3" fill={filled ? "#fff" : "none"} stroke={filled ? "#fff" : "currentColor"} />
      <path d="M6.5 18c1.4-2 3.3-3 5.5-3s4.1 1 5.5 3" stroke={filled ? "#fff" : "currentColor"} />
    </svg>
  );
}

export function GearIcon() {
  return (
    <svg {...base} width={22} height={22}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
    </svg>
  );
}

export function EyeIcon() {
  return (
    <svg {...base} width={14} height={14}>
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
