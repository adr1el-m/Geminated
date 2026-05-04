import express from "express";
import {
  createFacility,
  getAllFacilities,
  getFacility,
  updateFacility,
} from "../controllers/facilityControllers.js";

const router = express.Router();

// router.use(verifyJWT);
router
  .get("/", getAllFacilities)
  .get("/:id", getFacility)
  .post("/create", createFacility)
  .patch("/update/:id", updateFacility);

export default router;
