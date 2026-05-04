import express from "express";
import {
  createUser,
  getAllUsers,
  getUser,
  updateUser,
} from "../controllers/userControllers.js";

const router = express.Router();

router.post("/create", createUser);
// router.use(verifyJWT);
router
  .get("/", getAllUsers)
  .get("/:id", getUser)
  .patch("/update/:id", updateUser);

export default router;
