import Order from "../models/order.js";

// ✅ Get Admin KPI Stats
export async function getKPIStats(req, res) {
    // Security: Admin Only
    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ message: "Access Denied" });
    }

    try {
        // 1. General Stats (Financials)
        const totalRevenueData = await Order.aggregate([
            { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } }
        ]);
        const totalRevenue = totalRevenueData[0]?.total || 0;
        const totalOrders = totalRevenueData[0]?.count || 0;

        // 2. RDC Performance (Workload)
        // Counts how many non-pending orders each RDC is handling
        const rdcPerformance = await Order.aggregate([
            { $match: { status: { $ne: "pending" } } }, 
            { $group: { _id: "$originRDC", count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // 3. Driver Performance (Logistics)
        // Counts completed deliveries per driver
        const driverPerformance = await Order.aggregate([
            { $match: { status: "delivered" } },
            { $group: { _id: "$driver.name", deliveries: { $sum: 1 } } },
            { $sort: { deliveries: -1 } },
            { $limit: 10 } // Top 10 Drivers
        ]);

        // 4. Order Status Distribution
        const orderStatusDist = await Order.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);

        res.json({
            totalOrders,
            totalRevenue,
            rdcPerformance: rdcPerformance.map(r => ({ name: r._id || "Unassigned", value: r.count })),
            driverPerformance: driverPerformance.map(d => ({ name: d._id || "Unknown", value: d.deliveries })),
            orderStatus: orderStatusDist.map(s => ({ name: s._id, value: s.count }))
        });

    } catch (error) {
        console.error("KPI Error:", error);
        res.status(500).json({ message: "Failed to fetch KPIs" });
    }
}