import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    // ---------------------------------------------------------
    // ✅ YOUR EXISTING FIELDS (Unchanged)
    // ---------------------------------------------------------
    orderId : {
        type: String,
        required: true,
        unique: true
    },
    email : {
        type: String,
        required: true
		
    },
    name : {
        type: String,
        required: true
    },
    phone : {
        type: String,
        required: true
    },
    address : {
        type: String,
        required: true
    },
    status : {
        type: String,
        required: true,
        // I added "processing", "dispatched", "in transit" so the tracking timeline works.
        // Your original "pending", "delivered", "canceled" are still here.
        enum: ["pending", "processing", "dispatched", "in transit", "delivered", "canceled"],
        default: "pending"
    },
    labelledTotal : {
        type: Number,
        required: true
    },  
    total : {
        type: Number,
        required: true
    },
    products : [
        {
            productInfo : {
                productId : {
                    type: String,
                    required: true
                },
                name : {
                    type: String,
                    required: true
                },
                altNames : [{
                    type: String,
                }],
                description : {
                    type: String,
                    required: true
                },
                image : [{
                    type: String,
                }],
                price : {
                    type: Number,
                    required: true
                }
            },
            quantity : {
                type: Number,
                required: true
            },
        }
    ],
    date : {
        type: Date,
        default: Date.now
    },

    // ---------------------------------------------------------
    // ✅ NEW FIELDS ADDED FOR TRACKING (Safe to add)
    // ---------------------------------------------------------
    originRDC: {
        type: String,
        default: "Central RDC (Hub)"
    },
    driver: {
        name: { type: String, default: "Assigning..." },
        phone: { type: String, default: "--" },
        vehicleNo: { type: String, default: "--" }
    },
    estimatedDelivery: {
        type: Date
    },
    // Stores history so the timeline on the frontend shows real dates
    trackingHistory: [
        {
            status: String, 
            date: { type: Date, default: Date.now },
            completed: { type: Boolean, default: true }
        }
    ],

    paymentMethod: { type: String, required: true },
    paymentStatus: { type: String, default: "Pending" }, // Paid, Pending
    bankReceipt: { type: String }, // Stores Base64 image of receipt
});

const Order = mongoose.model("orders", orderSchema);
export default Order;