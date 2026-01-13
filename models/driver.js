import mongoose from "mongoose";

const driverSchema = mongoose.Schema({
    // Removed userId
    name: { type: String, required: true },
    vehicleNo: { type: String, required: true },
    licenseNo: { type: String, required: true },
    phone: { type: String, required: true },
    status: {
        type: String,
        enum: ["Available", "On Delivery", "Off Duty"],
        default: "Available"
    },
    currentLocation: {
        type: String,
        default: "Central RDC"
    },
    currentOrderId: {
        type: String,
        default: null
    }
});

const Driver = mongoose.model("drivers", driverSchema);
export default Driver;