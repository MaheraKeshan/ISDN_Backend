import Order from "../models/order.js";
import Product from "../models/product.js";
import sendInvoiceEmail from "../utils/invoice.js"; // Ensure this path matches your file structure
import Driver from "../models/driver.js";

// ✅ 1. Create a new order
export async function createOrder(req, res) {
    if (!req.user) return res.status(403).json({ message: "Please login first" });

    const orderInfo = req.body;
    const { paymentMethod, bankReceipt } = req.body;

    // --- VALIDATION: Bank Transfer must have a receipt ---
    if (paymentMethod === 'bank' && !bankReceipt) {
        return res.status(400).json({ message: "Bank transfer requires a receipt upload." });
    }

    if (!orderInfo.name) {
        orderInfo.name = `${req.user.firstName} ${req.user.lastName}`;
    }

    // Generate Order ID (CBC00001 format)
    let orderId = "CBC00001";
    const lastOrder = await Order.findOne().sort({ date: -1 });
    if (lastOrder && lastOrder.orderId && lastOrder.orderId.startsWith("CBC")) {
        const lastOrderNumber = parseInt(lastOrder.orderId.replace("CBC", ""), 10);
        if (!isNaN(lastOrderNumber)) {
            const newOrderNumber = lastOrderNumber + 1;
            orderId = "CBC" + String(newOrderNumber).padStart(5, "0");
        }
    }

    try {
        if (!orderInfo.products || orderInfo.products.length === 0) {
            return res.status(400).json({ message: "No products provided" });
        }

        let total = 0;
        let labelledTotal = 0;
        const products = [];

        // Process Products
        for (let i = 0; i < orderInfo.products.length; i++) {
            const productData = orderInfo.products[i];
            let item = await Product.findOne({ productId: productData.productId });
            
            // Fallback to MongoDB _id if custom ID fails
            if (!item) {
                try { item = await Product.findById(productData.productId); } catch (e) { /* ignore */ }
            }

            if (!item) return res.status(404).json({ message: `Product '${productData.productId}' not found.` });

            products.push({
                productInfo: {
                    productId: item.productId,
                    name: item.name,
                    image: item.image,
                    price: item.price,
                    labelledPrice: item.labelledPrice
                },
                quantity: productData.qty,
            });

            total += item.price * productData.qty;
            labelledTotal += item.labelledPrice * productData.qty;
        }

        // ✅ LOGIC: 
        // If Bank Transfer -> Status is 'payment_review' (Admin must approve)
        // If Card/COD -> Status is 'pending' (Order is placed immediately)
        const initialStatus = paymentMethod === 'bank' ? 'payment_review' : 'pending';
        
        const order = new Order({
            orderId,
            email: req.user.email,
            name: orderInfo.name,
            address: orderInfo.address,
            phone: orderInfo.phone,
            total,
            labelledTotal,
            products,
            date: new Date(),
            
            // Payment Info
            paymentMethod,
            bankReceipt: paymentMethod === 'bank' ? bankReceipt : null, // Save the image
            paymentStatus: paymentMethod === 'card' ? 'Paid' : 'Pending',

            // Order Status
            status: initialStatus,
            
            trackingHistory: [{ 
                status: initialStatus === 'payment_review' ? "Waiting for Payment Verification" : "Order Placed", 
                date: new Date(), 
                completed: true 
            }]
        });

        const createdOrder = await order.save();

        // Send Email (Invoice)
        try { await sendInvoiceEmail(createdOrder, req.user); } catch (e) { console.error(e) }

        return res.status(200).json({
            message: initialStatus === 'payment_review' 
                ? "Order received. Waiting for payment approval." 
                : "Order placed successfully",
            orderId: createdOrder.orderId,
        });

    } catch (err) {
        console.error("Error creating order:", err);
        return res.status(500).json({ message: "Failed to create order", error: err.message });
    }
}

// ... (Keep your createOrder function exactly as it is) ...

export async function updatePaymentStatus(req, res) {
    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
    }

    const { orderId } = req.params;
    const { status } = req.body; // "Paid" or "Rejected"

    if (!["Paid", "Rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid payment status" });
    }

    try {
        const update = {
            paymentStatus: status,
            status: status === "Paid" ? "pending" : "canceled",
            $push: {
                trackingHistory: {
                    status:
                        status === "Paid"
                            ? "Payment Verified - Order Placed"
                            : "Payment Rejected - Order Cancelled",
                    date: new Date(),
                    completed: true
                }
            }
        };

        const order = await Order.findOneAndUpdate(
            { orderId },
            update,
            { new: true } // return updated document
        );

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        return res.json({
            message: `Payment ${status}`,
            order
        });

    } catch (err) {
        console.error("❌ PAYMENT UPDATE ERROR:", err);
        return res.status(500).json({ message: err.message });
    }
}


// ... (Keep getOrder, sendQuote, updateOrderStatus, markOrderDelivered, trackOrder as they are) ...

// ✅ 3. Get order(s)
export async function getOrder(req, res) {
    if (!req.user) {
        return res.status(403).json({ message: "Please login first" });
    }

    try {
        // Admin/Staff see all, Customer sees own
        if (["admin", "rdc_staff", "logistics"].includes(req.user.role)) {
            const orders = await Order.find().sort({ date: -1 });
            return res.json(orders);
        } else {
            const orders = await Order.find({ email: req.user.email }).sort({ date: -1 });
            return res.json(orders);
        }
    } catch (err) {
        console.error("Error fetching orders:", err);
        return res.status(500).json({
            message: "Failed to fetch order(s)",
            error: err.message,
        });
    }
}

// ✅ 4. Send Quote (Email Only)
export async function sendQuote(req, res) {
    if (!req.user) return res.status(403).json({ message: "Login required" });

    try {
        const mockOrder = {
            orderId: "QUOTE-" + Date.now().toString().slice(-4),
            total: req.body.total,
            address: req.body.address,
            products: req.body.products, 
            paymentMethod: "Standard Invoice (Net 30)"
        };

        await sendInvoiceEmail(mockOrder, req.user);
        res.json({ message: "Proforma Invoice sent to email" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to send invoice" });
    }
}

// ✅ 5. Update Order Status (General)
export async function updateOrderStatus(req, res) {
    const { orderId, status } = req.params;

    try {
        const order = await Order.findOne({ orderId });
        if (!order) return res.status(404).json({ message: "Order not found" });

        // Permission Logic
        if (req.user.role === "customer") {
            if (status !== "canceled") return res.status(403).json({ message: "Customers can only cancel orders." });
            if (order.status !== "pending") return res.status(400).json({ message: "Order cannot be canceled." });
        } 
        else if (!["admin", "rdc_staff", "logistics"].includes(req.user.role)) {
            return res.status(403).json({ message: "Access Denied" });
        }

        order.status = status;
        order.trackingHistory.push({
            status: status.charAt(0).toUpperCase() + status.slice(1),
            date: new Date(),
            completed: true
        });

        await order.save();
        res.json({ message: `Order status updated to ${status}`, order });

    } catch (err) {
        res.status(500).json({ message: "Update failed", error: err.message });
    }
}

// ✅ 6. Mark Delivered (Logistics)
export async function markOrderDelivered(req, res) {
    const { orderId } = req.params;

    console.log("1. 🚚 Received Request to deliver Order:", orderId);

    try {
        // 1. Find and Update Order
        const order = await Order.findOneAndUpdate(
            { orderId: orderId },
            { 
                status: "delivered",
                $push: { 
                    trackingHistory: { 
                        status: "Delivered", 
                        date: new Date(), 
                        completed: true 
                    } 
                }
            },
            { new: true }
        );

        if (!order) {
            console.log("❌ Order not found in DB:", orderId);
            return res.status(404).json({ message: "Order not found" });
        }
        console.log("2. ✅ Order updated to Delivered");

        // 2. Find and Update Driver (Free them up)
        const driver = await Driver.findOneAndUpdate(
            { currentOrderId: orderId },
            { 
                status: "Available",
                currentOrderId: null 
            },
            { new: true }
        );

        if (driver) {
            console.log("3. ✅ Driver freed:", driver.name);
        } else {
            console.log("3. ⚠️ No driver was assigned to this order (or already freed).");
        }

        res.status(200).json({ message: "Delivery confirmed", order });

    } catch (error) {
        console.error("❌ SERVER CRASH:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
}

// ✅ 7. Track Order
export async function trackOrder(req, res) {
    const { orderId } = req.params;

    try {
        const order = await Order.findOne({ 
            orderId: { $regex: new RegExp(`^${orderId}$`, "i") } 
        });

        if (!order) return res.status(404).json({ message: "Order ID not found." });

        const currentStatus = order.status.toLowerCase();

        // Dynamic Timeline based on current status
        const timeline = [
            { status: "Order Placed", date: order.date, completed: true },
            { status: "Processing", date: null, completed: ["processing", "dispatched", "in transit", "delivered"].includes(currentStatus) },
            { status: "Dispatched", date: null, completed: ["dispatched", "in transit", "delivered"].includes(currentStatus) },
            { status: "In Transit", date: null, completed: ["in transit", "delivered"].includes(currentStatus), current: currentStatus === "in transit" },
            { status: "Delivered", date: null, completed: currentStatus === "delivered" }
        ];
        
        // If in payment review, show special status
        if (currentStatus === 'payment_review') {
             timeline[0].status = "Waiting for Payment Verification";
        }

        const trackingData = {
            id: order.orderId,
            status: order.status.charAt(0).toUpperCase() + order.status.slice(1), 
            eta: order.estimatedDelivery ? new Date(order.estimatedDelivery).toDateString() : "Standard Delivery (48 Hrs)",
            origin: order.originRDC || "Central RDC",
            destination: order.address, 
            driver: {
                name: order.driver?.name || "Pending Assignment",
                vehicle: order.driver?.vehicleNo || "--",
                phone: order.driver?.phone || "--"
            },
            timeline: timeline.map(event => ({
                status: event.status,
                date: event.date ? new Date(event.date).toLocaleDateString() : (event.completed ? "Completed" : "Pending"),
                completed: event.completed,
                current: event.current || false
            }))
        };

        res.json(trackingData);

    } catch (err) {
        res.status(500).json({ message: "Server Error" });
    }
}