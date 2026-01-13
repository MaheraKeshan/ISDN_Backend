import express from 'express';
import {addStock, transferStock, getInventory } from '../controllers/inventoryController.js';

const inventoryRouter = express.Router();

inventoryRouter.post("/add", addStock);
inventoryRouter.post("/transfer", transferStock);
inventoryRouter.get("/:rdc", getInventory);

export default inventoryRouter;