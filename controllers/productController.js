import Product from "../models/product.js";
import { isAdmin } from "./userController.js";

// ✅ MODIFIED: Allows Admin AND RDC Staff to see all products (even hidden ones)
export async function getProducts(req, res) {
    try {
        // Check if user is Admin OR RDC Staff
        const isAuthorized = isAdmin(req) || (req.user && req.user.role === "rdc_staff");

        if (isAuthorized) {
            const products = await Product.find();
            res.json(products);
        } else {
            const products = await Product.find({ isAvailable: true });
            res.json(products);
        }
    } catch (err) {
        res.status(500).json({
            message: "Failed to get products",
            error: err.message
        });
    }
}

// ✅ UNCHANGED: Your original function
export function saveProduct(req, res) {
    if (!isAdmin(req)) {
        res.status(403).json({
            message: "You are not authorized to add a product"
        });
        return;
    }

    const product = new Product(req.body);

    product.save().then(() => {
        res.json({
            message: "Product added successfully",
        });
    }).catch((err) => {
        res.status(500).json({
            message: "Failed to add Product",
            error: err.message
        });
    });
}

// ✅ UNCHANGED: Your original function
export async function deleteProduct(req, res) {
    if (!isAdmin(req)) {
        res.status(403).json({
            message: "You are not authorized to delete a product"
        });
        return;
    }
    try {
        await Product.deleteOne({ productId: req.params.productId });
        res.json({
            message: "Product deleted successfully"
        });
    } catch (err) {
        res.status(500).json({
            message: "Failed to delete product",
            error: err.message
        });
    }
}

// ✅ UNCHANGED: Your original function
export async function updateProduct(req, res) {
    if (!isAdmin(req)) {
        res.status(403).json({
            message: "You are not authorized to update a product"
        });
        return;
    }

    const productId = req.params.productId;
    const updatingData = req.body;

    try {
        await Product.updateOne({ productId: productId }, updatingData);
        res.json({
            message: "Product update successfully"
        });
    } catch (err) {
        res.status(500).json({
            message: "Failed to update product",
            error: err.message
        });
    }
}

// ✅ MODIFIED: Allows RDC Staff to view details of hidden/unavailable products
export async function getProductById(req, res) {
    const productId = req.params.productId;

    try {
        const product = await Product.findOne({ productId: productId });
        if (product == null) {
            res.status(404).json({
                message: "Product not found"
            });
            return;
        }

        // If product is available, everyone can see it
        if (product.isAvailable) {
            res.json(product);
        } else {
            // If NOT available, check permissions
            const isAuthorized = isAdmin(req) || (req.user && req.user.role === "rdc_staff");
            
            if (isAuthorized) {
                res.json(product);
            } else {
                res.status(404).json({
                    message: "Product not found"
                });
            }
        }
    } catch (err) {
        res.status(500).json({
            message: "Failed to get product",
            error: err.message
        });
    }
}

// ✅ MODIFIED: Allows RDC Staff to search for hidden items (to add to inventory)
export async function searchProducts(req, res) {
    const searchQuery = req.params.query;

    try {
        const filter = {
            $or: [
                { name: { $regex: searchQuery, $options: 'i' } },
                { altNames: { $elemMatch: { $regex: searchQuery, $options: 'i' } } }
            ]
        };

        // If user is NOT Admin AND NOT RDC Staff, restrict to isAvailable: true
        const isAuthorized = isAdmin(req) || (req.user && req.user.role === "rdc_staff");
        
        if (!isAuthorized) {
            filter.isAvailable = true;
        }

        const products = await Product.find(filter);
        res.json(products);
    } catch (err) {
        res.status(500).json({
            message: "Failed to search products",
            error: err.message
        });
    }
}