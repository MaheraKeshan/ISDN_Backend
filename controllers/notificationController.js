import Notification from "../models/Notification.js"; 

// @desc    Get all notifications (For RDC Staff)
// @route   GET /api/notifications
// @access  Private
export const getNotifications = async (req, res) => {
  try {
    // Fetch notifications sorted by newest first
    const notifications = await Notification.find().sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
};

// @desc    Create a Restock Request (From Admin)
// @route   POST /api/notifications/restock-request
// @access  Private (Admin)
export const createRestockRequest = async (req, res) => {
  const { productId, productName, currentStock, message } = req.body;

  // Simple validation
  if (!productId || !productName || !message) {
    return res.status(400).json({ message: "Please provide all required fields" });
  }

  try {
    const notification = new Notification({
      type: "restock_alert",
      productId,
      productName,
      currentStock,
      message,
    });

    const savedNotification = await notification.save();
    res.status(201).json(savedNotification);
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({ message: "Failed to send alert" });
  }
};

// @desc    Delete/Dismiss a notification
// @route   DELETE /api/notifications/:id
// @access  Private
export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    await notification.deleteOne();
    res.json({ message: "Notification removed" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ message: "Error deleting notification" });
  }
};