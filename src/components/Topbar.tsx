export default function Topbar({ title }: { title: string }) {
    return (
        <header className="topbar">
            <div className="topbar-title">{title}</div>
            <div className="topbar-profile">Owner Profile</div>
        </header>
    );
}
