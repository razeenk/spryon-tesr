export default function MenuTable() {
    const menuItems = [
        { id: "1", name: "Avocado Toast", category: "Breakfast", price: "$12", available: true },
        { id: "2", name: "Iced Latte", category: "Drinks", price: "$6", available: true },
        { id: "3", name: "Truffle Fries", category: "Sides", price: "$9", available: false },
        { id: "4", name: "Smashburger", category: "Mains", price: "$15", available: true },
    ];

    return (
        <div className="card" style={{ marginTop: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "600" }}>Menu Items</h3>
                <button className="btn-primary">Add Item</button>
            </div>

            <table className="table">
                <thead>
                    <tr>
                        <th>Item Name</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {menuItems.map((item) => (
                        <tr key={item.id}>
                            <td style={{ fontWeight: "500" }}>{item.name}</td>
                            <td style={{ color: "var(--muted)" }}>{item.category}</td>
                            <td>{item.price}</td>
                            <td>
                                {item.available ? (
                                    <span style={{ color: "var(--accent)", fontSize: "13px", fontWeight: "500" }}>Available</span>
                                ) : (
                                    <span style={{ color: "var(--muted)", fontSize: "13px" }}>Sold Out</span>
                                )}
                            </td>
                            <td>
                                <button className="btn-secondary" style={{ padding: "4px 8px", fontSize: "12px" }}>Edit</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
