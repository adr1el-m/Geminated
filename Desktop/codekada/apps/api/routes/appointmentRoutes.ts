import express from "express";
import {
  createAppointment,
  getAllAppointments,
  getAppointment,
  getMyAppointments,
  getFacilities,
  updateStatus
} from "../controllers/appointmentControllers.js";
import { verifyJWT } from "../middlewares/verifyJWT.js";

const router = express.Router();

router.use(verifyJWT);

router.get("/", getAllAppointments);
router.get("/my-appointments", getMyAppointments);
router.get("/facilities", getFacilities);
router.get("/:id", getAppointment);
router.post("/", createAppointment);
router.patch("/:id/status", updateStatus);

export default router;
