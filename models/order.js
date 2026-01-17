import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    // ---------------------------------------------------------
    // ✅ EXISTING FIELDS
    // ---------------------------------------------------------
    orderId : { type: String, required: true, unique: true },
    email : { type: String, required: true },
    name : { type: String, required: true },
    phone : { type: String, required: true },
    address : { type: String, required: true },
    
    // ✅ FIX: Added "payment_review" and "returned" to this list.
    // Without "payment_review", bank transfer orders will CRASH when you try to update them.
    status : {
        type: String,
        required: true,
        enum: ["payment_review", "pending", "processing", "dispatched", "in transit", "delivered", "canceled", "returned"],
        default: "pending"
    },

    labelledTotal : { type: Number, required: true },  
    total : { type: Number, required: true },
    
    products : [
        {
            productInfo : {
                productId : { type: String, required: true },
                name : { type: String, required: true },
                altNames : [{ type: String }],
                // I removed 'required: true' from description to prevent crashes if a product description is missing
                description : { type: String }, 
                image : [{ type: String }],
                price : { type: Number, required: true },
                labelledPrice: { type: Number }
            },
            quantity : { type: Number, required: true },
        }
    ],
    date : { type: Date, default: Date.now },

    // ---------------------------------------------------------
    // ✅ TRACKING & PAYMENT FIELDS
    // ---------------------------------------------------------
    originRDC: { type: String, default: "Central RDC (Hub)" },
    
    driver: {
        name: { type: String, default: "Pending Assignment" },
        phone: { type: String, default: "--" },
        vehicleNo: { type: String, default: "--" }
    },

    estimatedDelivery: { type: Date },
    
    trackingHistory: [
        {
            status: String, 
            date: { type: Date, default: Date.now },
            completed: { type: Boolean, default: true }
        }
    ],

    paymentMethod: { type: String, required: true },
    paymentStatus: {
            type: String,
            enum: ["Paid", "Pending", "Rejected"],
            default: "Pending"
},
    bankReceipt: { type: String }, 
    requestedDeliveryDate: { type: String } 
});

const Order = mongoose.model("orders", orderSchema);
export default Order;