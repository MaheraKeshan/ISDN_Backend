import express from "express";
import { getDrivers, addDriver, assignDriver } from "../controllers/driverController.js";

const driverRouter = express.Router();

driverRouter.get("/", getDrivers);
driverRouter.post("/add", addDriver);
driverRouter.post("/assign", assignDriver);

export default driverRouter;