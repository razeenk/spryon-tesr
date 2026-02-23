export default function Stats() {
    const statsData = [
        { label: "Total Scans Today", value: "142" },
        { label: "Active Sessions", value: "12" },
        { label: "Items on Menu", value: "34" },
    ];

    return (
        <div className="stats-grid">
            {statsData.map((stat, i) => (
                <div key={i} className="card stat">
                    <div className="stat-label">{stat.label}</div>
                    <div className="stat-value">{stat.value}</div>
                </div>
            ))}
        </div>
    );
}
