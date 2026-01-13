import express from "express";
import { 
  getNotifications, 
  createRestockRequest, 
  deleteNotification 
} from "../controllers/notificationController.js"; // ✅ Note the .js extension

const router = express.Router();

router.get("/", getNotifications);
router.post("/restock-request", createRestockRequest);
router.delete("/:id", deleteNotification);

export default router;