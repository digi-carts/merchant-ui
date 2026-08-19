// Custom SVG icons for the admin sidebar
export function IconDashboard({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" fill="currentColor" fillOpacity="0.2" />
    </svg>
  );
}

export function IconCatalog({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 7H4a1 1 0 00-1 1v10a1 1 0 001 1h16a1 1 0 001-1V8a1 1 0 00-1-1z" />
      <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
      <path d="M12 12v4" />
      <path d="M10 14h4" />
    </svg>
  );
}

export function IconStock({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l4-4 4 4 4-4 4 4" />
      <path d="M3 15h18" />
      <rect x="5" y="15" width="4" height="5" rx="0.5" fill="currentColor" fillOpacity="0.2" />
      <rect x="10" y="13" width="4" height="7" rx="0.5" fill="currentColor" fillOpacity="0.2" />
      <rect x="15" y="11" width="4" height="9" rx="0.5" fill="currentColor" fillOpacity="0.2" />
    </svg>
  );
}

export function IconOrders({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="M9 12h6" />
      <path d="M9 16h4" />
    </svg>
  );
}

export function IconReports({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <path d="M7 16l4-5 4 3 4-6" />
      <circle cx="7" cy="16" r="1" fill="currentColor" />
      <circle cx="11" cy="11" r="1" fill="currentColor" />
      <circle cx="15" cy="14" r="1" fill="currentColor" />
      <circle cx="19" cy="8" r="1" fill="currentColor" />
    </svg>
  );
}

export function IconAlerts({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 10a6 6 0 0112 0v4l2 2H4l2-2v-4z" />
      <path d="M10 20a2 2 0 004 0" />
      <circle cx="18" cy="5" r="3" fill="#f97316" stroke="none" />
    </svg>
  );
}

export function IconNotifications({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 10a6 6 0 0112 0v4l2 2H4l2-2v-4z" />
      <path d="M10 20a2 2 0 004 0" />
      <path d="M15 3.5a3 3 0 013 3" strokeOpacity="0.5" />
    </svg>
  );
}

export function IconDomain({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3c-2 2.5-3 5.5-3 9s1 6.5 3 9" />
      <path d="M12 3c2 2.5 3 5.5 3 9s-1 6.5-3 9" />
      <path d="M3 12h18" />
    </svg>
  );
}

export function IconSubscription({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="13" rx="2" />
      <path d="M2 10h20" />
      <circle cx="7" cy="15" r="1.5" fill="currentColor" />
      <path d="M11 15h6" strokeWidth="2" />
    </svg>
  );
}

export function IconPayment({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="15" rx="2" />
      <path d="M2 9h20" strokeWidth="2.5" />
      <rect x="5" y="13" width="4" height="3" rx="0.5" fill="currentColor" fillOpacity="0.4" />
    </svg>
  );
}

export function IconPages({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="13" height="18" rx="1.5" />
      <path d="M17 6h2a1 1 0 011 1v14a1 1 0 01-1 1H8a1 1 0 01-1-1v-2" />
      <path d="M7 7h7" />
      <path d="M7 11h7" />
      <path d="M7 15h4" />
    </svg>
  );
}

export function IconSettings({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}

export function IconCustomize({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" />
    </svg>
  );
}
