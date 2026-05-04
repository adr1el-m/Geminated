import express from "express";
import {
  createPatient,
  getAllPatients,
  getPatient,
  updatePatient,
} from "../controllers/patientControllers.js";

const router = express.Router();

// router.use(verifyJWT);
router
  .get("/", getAllPatients)
  .get("/:id", getPatient)
  .post("/create", createPatient)
  .patch("/update/:id", updatePatient);

export default router;
