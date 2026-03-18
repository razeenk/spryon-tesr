"use client";

export default function Topbar({
    title,
    subtitle,
    onMenuToggle,
    right,
}: {
    title: string;
    subtitle?: string;
    onMenuToggle?: () => void;
    right?: React.ReactNode;
}) {
    return (
        <header className="topbar">
            <div className="topbar-left">
                {/* Hamburger — mobile only */}
                {onMenuToggle && (
                    <button
                        onClick={onMenuToggle}
                        className="hamburger-btn"
                        aria-label="Open menu"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="3" y1="6" x2="21" y2="6" />
                            <line x1="3" y1="12" x2="21" y2="12" />
                        </svg>
                    </button>
                )}
                <div>
                    <div className="topbar-title">{title}</div>
                    {subtitle && <div className="topbar-subtitle">{subtitle}</div>}
                </div>
            </div>
            {right && <div className="topbar-right">{right}</div>}
        </header>
    );
}
