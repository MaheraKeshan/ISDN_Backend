import mongoose from "mongoose";

const inventorySchema = mongoose.Schema({
    rdc: { 
        type: String, 
        required: true,
        enum: ["North", "South", "East", "West", "Central"], // The 5 RDCs from the case study
        uppercase: true
    },
    productId: {
        type: String,
        required: true,
        ref: 'products' // Logic link to your Product model
    },
    quantity: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});

// Compound index to ensure one product entry per RDC
inventorySchema.index({ rdc: 1, productId: 1 }, { unique: true });

const Inventory = mongoose.model("inventories", inventorySchema);
export default Inventory;