import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  type: { type: String, default: "restock_alert" },
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  currentStock: { type: Number, required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Notification", notificationSchema);