import Inventory from "../models/inventory.js";
import Product from "../models/product.js";

// ✅ 1. Add Stock (RDC Staff receiving goods)
// ✅ 1. Add/Adjust Stock (Updated to allow negative adjustments)
export async function addStock(req, res) {
    if (!req.user || (req.user.role !== "rdc_staff" && req.user.role !== "admin")) {
        return res.status(403).json({ message: "Access Denied" });
    }

    const { rdc, productId, quantity } = req.body;

    // ✅ FIX: Allow negative numbers for corrections, but prevent 0
    if (!quantity || quantity === 0) {
        return res.status(400).json({ message: "Invalid quantity adjustment" });
    }

    try {
        const productExists = await Product.findOne({ productId: productId });
        if (!productExists) {
            return res.status(404).json({ message: "Product ID not found" });
        }

        const inventoryItem = await Inventory.findOneAndUpdate(
            { rdc: rdc, productId: productId },
            { 
                $inc: { quantity: quantity }, // Adds (or subtracts if negative)
                $set: { lastUpdated: new Date() }
            },
            { new: true, upsert: true }
        );

        // Prevent negative stock
        if (inventoryItem.quantity < 0) {
            // Revert if it went below zero
            await Inventory.findOneAndUpdate(
                { rdc: rdc, productId: productId },
                { $inc: { quantity: -quantity } }
            );
            return res.status(400).json({ message: "Cannot reduce stock below zero" });
        }

        await updateGlobalProductStock(productId);

        res.json({ 
            message: `Stock updated successfully`, 
            inventory: inventoryItem 
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to update inventory", error: error.message });
    }
}

// ✅ 2. Transfer Stock (Moving goods from one RDC to another)
export async function transferStock(req, res) {
    if (!req.user || (req.user.role !== "rdc_staff" && req.user.role !== "admin")) {
        return res.status(403).json({ message: "Access Denied" });
    }

    const { sourceRDC, targetRDC, productId, quantity } = req.body;

    if (sourceRDC === targetRDC) {
        return res.status(400).json({ message: "Source and Target RDC cannot be the same" });
    }

    const session = await Inventory.startSession();
    session.startTransaction();

    try {
        // 1. Check Source Availability
        const sourceItem = await Inventory.findOne({ rdc: sourceRDC, productId: productId }).session(session);
        
        if (!sourceItem || sourceItem.quantity < quantity) {
            throw new Error(`Insufficient stock in ${sourceRDC} RDC`);
        }

        // 2. Deduct from Source
        await Inventory.findOneAndUpdate(
            { rdc: sourceRDC, productId: productId },
            { $inc: { quantity: -quantity }, lastUpdated: new Date() },
            { session }
        );

        // 3. Add to Target
        await Inventory.findOneAndUpdate(
            { rdc: targetRDC, productId: productId },
            { $inc: { quantity: quantity }, lastUpdated: new Date() },
            { upsert: true, session }
        );

        await session.commitTransaction();
        res.json({ message: `Successfully transferred ${quantity} units from ${sourceRDC} to ${targetRDC}` });

    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({ message: "Transfer failed", error: error.message });
    } finally {
        session.endSession();
    }
}

// ✅ 3. Get Inventory by RDC
export async function getInventory(req, res) {
    const { rdc } = req.params;
    try {
        const stock = await Inventory.find({ rdc: rdc });
        res.json(stock);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch inventory" });
    }
}

// Helper to sync total stock to Product model (Optional but recommended)
async function updateGlobalProductStock(productId) {
    const allStock = await Inventory.find({ productId: productId });
    const totalQty = allStock.reduce((acc, item) => acc + item.quantity, 0);
    await Product.updateOne({ productId: productId }, { stock: totalQty });
}