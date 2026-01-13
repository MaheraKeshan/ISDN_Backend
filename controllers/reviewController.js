import Review from '../models/review.js';
import Product from '../models/product.js';

// POST /reviews
export async function addReview(req, res) {
	if (!req.user) {
		return res.status(403).json({ message: "Please login to submit a review" });
	}

	const { productId, rating, comment } = req.body;

	if (!rating || !comment) {
		return res.status(400).json({ message: "Rating and comment are required" });
	}

	try {
		const product = await Product.findById(productId);
		if (!product) {
			return res.status(404).json({ message: "Product not found" });
		}

		const review = new Review({
			productId,
			userEmail: req.user.email,
			userName: `${req.user.firstName} ${req.user.lastName}`,
			rating,
			comment
		});

		await review.save();
		res.status(200).json({ message: "Review added successfully" });
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: "Failed to submit review" });
	}
}

// GET /reviews/:productId
export async function getReviewsByProduct(req, res) {
	const { productId } = req.params;

	try {
		const reviews = await Review.find({ productId }).sort({ date: -1 });
		res.status(200).json(reviews);
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: "Failed to fetch reviews" });
	}
}
export async function getUserReviewsForProduct(req, res) {
  const { productId } = req.params;
  const userId = req.user.id; // Assuming we have user id from the authentication middleware

  try {
    const reviews = await Review.find({ productId, userId }).sort({ date: -1 });
    res.status(200).json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch user reviews" });
  }
}


export async function getAllReviews(req, res) {
    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ message: "Unauthorized - Admin access required" });
    }

    try {
        // Fetch all reviews sorted by date (newest first)
        const reviews = await Review.find({})
            .sort({ date: -1 })
            .lean(); // Using lean() for better performance since we don't need mongoose documents

        res.status(200).json({ reviews });
    } catch (err) {
        console.error(err);
        res.status(500).json({ 
            message: "Failed to fetch reviews",
            error: err.message 
        });
    }
}
// DELETE /reviews/:reviewId (admin only)
// DELETE /reviews/:reviewId

export async function deleteReview(req, res) {
    if (!req.user) {
        return res.status(403).json({ message: "You must be logged in to delete a review" });
    }

    const { reviewId } = req.params;
    const isAdmin = req.user.role === "admin";

    try {
        // Only admins can delete reviews
        if (!isAdmin) {
            return res.status(403).json({ message: "Only admins can delete reviews" });
        }

        // Find and delete review
        const deletedReview = await Review.findByIdAndDelete(reviewId);

        if (!deletedReview) {
            return res.status(404).json({ message: "Review not found" });
        }

        res.status(200).json({
            message: "Review deleted successfully",
            deletedReview
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Failed to delete review",
            error: err.message
        });
    }
}
