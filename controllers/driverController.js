import Driver from "../models/driver.js";
import Order from "../models/order.js";

// 1. Get Drivers
export async function getDrivers(req, res) {
    try {
        const drivers = await Driver.find();
        res.json(drivers);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch fleet data" });
    }
}

// ✅ 2. Add New Driver (Directly - No User Account needed)
export async function addDriver(req, res) {
    if (!req.user || (req.user.role !== "logistics" && req.user.role !== "admin")) {
        return res.status(403).json({ message: "Access Denied" });
    }

    try {
        const newDriver = new Driver({
            name: req.body.name,
            vehicleNo: req.body.vehicleNo,
            licenseNo: req.body.licenseNo,
            phone: req.body.phone,
            status: "Available"
        });

        await newDriver.save();
        res.status(201).json({ message: "Driver added to fleet", driver: newDriver });

    } catch (error) {
        res.status(500).json({ message: "Failed to add driver", error: error.message });
    }
}

// ✅ 3. Assign Driver (Updated to use Driver ID)
export async function assignDriver(req, res) {
    if (!req.user || (req.user.role !== "logistics" && req.user.role !== "admin")) {
        return res.status(403).json({ message: "Access Denied" });
    }

    const { orderId, driverId } = req.body;

    try {
        // Find driver by their DB ID
        const driver = await Driver.findById(driverId); 
        
        if (!driver || driver.status !== "Available") {
            return res.status(400).json({ message: "Driver is unavailable" });
        }

        const order = await Order.findOneAndUpdate(
            { orderId: orderId },
            { 
                status: "dispatched",
                driver: {
                    name: driver.name,
                    vehicleNo: driver.vehicleNo,
                    phone: driver.phone
                }
            },
            { new: true }
        );

        if (!order) return res.status(404).json({ message: "Order not found" });

        driver.status = "On Delivery";
        driver.currentOrderId = orderId;
        await driver.save();

        res.json({ message: "Driver assigned successfully", order });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Assignment failed" });
    }
}