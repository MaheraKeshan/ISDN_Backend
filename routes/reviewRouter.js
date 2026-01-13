import express from 'express';
import { addReview, getReviewsByProduct, deleteReview,getUserReviewsForProduct, getAllReviews } from '../controllers/reviewController.js';


const reviewRouter = express.Router();

reviewRouter.post('/', addReview);
reviewRouter.get('/product/:productId', getReviewsByProduct);
reviewRouter.get('/user/:productId', getUserReviewsForProduct); 
reviewRouter.delete('/:reviewId', deleteReview);
reviewRouter.get('/', getAllReviews); // Added route to get all reviews

export default reviewRouter;
