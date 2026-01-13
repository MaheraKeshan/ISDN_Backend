import Order from "../models/order.js";
import Product from "../models/product.js";
import sendInvoiceEmail from "../utils/invoice.js";

// ✅ 1. Create a new order (Fixed orderId definition)
export async function createOrder(req, res) {
    if (!req.user) {
        return res.status(403).json({ message: "Please login first" });
    }

    const orderInfo = req.body;

    // Auto-fill name if not provided
    if (!orderInfo.name) {
        orderInfo.name = `${req.user.firstName} ${req.user.lastName}`;
    }

    // ---------------------------------------------------------
    // ✅ GENERATE ORDER ID (Moved logic here to ensure scope)
    // ---------------------------------------------------------
    let orderId = "CBC00001"; // Default start ID
    
    try {
        // Find the last created order to increment the ID
        const lastOrder = await Order.findOne().sort({ date: -1 });
        
        if (lastOrder) {
            const lastOrderId = lastOrder.orderId; // e.g., "CBC00551"
            
            // Extract the number part safely
            // Checks if ID starts with CBC to avoid parsing errors on legacy data
            if (lastOrderId && lastOrderId.startsWith("CBC")) {
                const lastOrderNumber = parseInt(lastOrderId.replace("CBC", ""), 10);
                if (!isNaN(lastOrderNumber)) {
                    const newOrderNumber = lastOrderNumber + 1;
                    orderId = "CBC" + String(newOrderNumber).padStart(5, "0");
                }
            }
        }
        // ---------------------------------------------------------


        // Validate product list
        if (!orderInfo.products || !Array.isArray(orderInfo.products) || orderInfo.products.length === 0) {
            return res.status(400).json({ message: "No products provided in order" });
        }

        let total = 0;
        let labelledTotal = 0;
        const products = [];

        for (let i = 0; i < orderInfo.products.length; i++) {
            const productData = orderInfo.products[i];

            // Product Lookup (Custom ID -> Fallback to Mongo ID)
            let item = await Product.findOne({ productId: productData.productId });
            
            if (!item) {
                try {
                    item = await Product.findById(productData.productId);
                } catch (e) {
                    // Ignore cast error
                }
            }

            if (!item) {
                return res.status(404).json({
                    message: `Product with ID '${productData.productId}' not found.`,
                });
            }

            products.push({
                productInfo: {
                    productId: item.productId,
                    name: item.name,
                    altNames: item.altNames,
                    description: item.description,
                    image: item.image,
                    labelledPrice: item.labelledPrice,
                    price: item.price,
                },
                quantity: productData.qty,
            });

            total += item.price * productData.qty;
            labelledTotal += item.labelledPrice * productData.qty;
        }

        const { paymentMethod, bankReceipt } = req.body;
        const initialStatus = paymentMethod === 'bank' ? 'payment_review' : 'pending';

        const order = new Order({
            orderId: orderId, // ✅ This variable is now guaranteed to be defined
            email: req.user.email,
            name: orderInfo.name,
            address: orderInfo.address,
            phone: orderInfo.phone,
            total,
            labelledTotal,
            products,
            date: new Date(),
            
            // Payment Data
            paymentMethod,
            bankReceipt: paymentMethod === 'bank' ? bankReceipt : null,
            paymentStatus: paymentMethod === 'card' ? 'Paid' : 'Pending',

            // Status
            status: initialStatus,
            originRDC: "Central RDC (Hub)",
            driver: { name: "Pending Assignment", phone: "--", vehicleNo: "--" },
            
            // Tracking History
            trackingHistory: [{ 
                status: initialStatus === 'payment_review' ? "Waiting for Payment Verification" : "Order Placed", 
                date: new Date(), 
                completed: true 
            }]
        });

        const createdOrder = await order.save();

        // Send Email
        try { await sendInvoiceEmail(createdOrder, req.user); } catch (e) { console.error(e) }

        return res.status(200).json({
            message: "Order created successfully",
            orderId: createdOrder.orderId,
        });

    } catch (err) {
        console.error("Error creating order:", err);
        return res.status(500).json({
            message: "Failed to create order",
            error: err.message,
        });
    }
}

// ✅ 2. Get order(s)
export async function getOrder(req, res) {
    if (!req.user) {
        return res.status(403).json({ message: "Please login first" });
    }

    try {
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

// ✅ 3. Update Payment Status (Admin Only)
export async function updatePaymentStatus(req, res) {
    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ message: "Access Denied" });
    }

    const { orderId } = req.params;
    const { status } = req.body; 

    try {
        const order = await Order.findOne({ orderId });
        if (!order) return res.status(404).json({ message: "Order not found" });

        order.paymentStatus = status;

        if (status === "Paid" && order.status === "payment_review") {
            order.status = "pending";
            order.trackingHistory.push({
                status: "Payment Verified",
                date: new Date(),
                completed: true
            });
            order.trackingHistory.push({
                status: "Order Placed",
                date: new Date(),
                completed: true
            });
        }
        else if (status === "Rejected") {
            order.status = "canceled";
            order.trackingHistory.push({
                status: "Payment Rejected",
                date: new Date(),
                completed: true
            });
        }

        await order.save();
        res.json({ message: `Payment updated to ${status}`, order });

    } catch (err) {
        res.status(500).json({ message: "Update failed" });
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

// ✅ 6. Track Order
export async function trackOrder(req, res) {
    const { orderId } = req.params;

    try {
        const order = await Order.findOne({ 
            orderId: { $regex: new RegExp(`^${orderId}$`, "i") } 
        });

        if (!order) return res.status(404).json({ message: "Order ID not found." });

        const currentStatus = order.status.toLowerCase();

        // Dynamic Timeline
        const timeline = [
            { status: "Order Placed", date: order.date, completed: true },
            { status: "Processing", date: null, completed: ["processing", "dispatched", "in transit", "delivered"].includes(currentStatus) },
            { status: "Dispatched", date: null, completed: ["dispatched", "in transit", "delivered"].includes(currentStatus) },
            { status: "In Transit", date: null, completed: ["in transit", "delivered"].includes(currentStatus), current: currentStatus === "in transit" },
            { status: "Delivered", date: null, completed: currentStatus === "delivered" }
        ];

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