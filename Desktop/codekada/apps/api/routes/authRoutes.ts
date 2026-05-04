import express from "express";
import { 
  login, 
  registerPatient, 
  registerFacility, 
  refresh, 
  logout 
} from "../controllers/authControllers.js";

const router = express.Router();

router.post("/login", login);
router.post("/register/patient", registerPatient);
router.post("/register/facility", registerFacility);
router.post("/refresh", refresh);
router.post("/logout", logout);

export default router;
