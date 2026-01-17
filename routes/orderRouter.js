import express from 'express';
import { createOrder, getOrder, updateOrderStatus, trackOrder, sendQuote, markOrderDelivered, updatePaymentStatus} from '../controllers/orderController.js';
const orderRouter = express.Router();

orderRouter.post('/', createOrder);
orderRouter.get('/', getOrder);
orderRouter.put("/:orderId/delivered", markOrderDelivered)
orderRouter.put("/:orderId/payment", updatePaymentStatus);
orderRouter.put('/:orderId/:status', updateOrderStatus);;
orderRouter.get("/track/:orderId", trackOrder);
orderRouter.post("/quote", sendQuote);



export default orderRouter;