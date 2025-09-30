import express from "express";
import {
  registerGuide,
  loginGuide,
  forgotPasswordGuide,
  resetPasswordGuide,
  changePasswordGuide,
  getAllGuides,
  getActiveGuides,
  updateGuideStatus,
  updateGuideAvailability,
  updateGuide,
  deleteGuide,
  createGuideByAdmin,
} from "../controllers/guideController.js";
import { protectAdmin, protectGuide } from "../middlewares/authMiddleware.js";

const router = express.Router();
// Auth Routes
// POST /api/guides/register
router.post("/register", registerGuide);
// POST /api/guides/login
router.post("/login", loginGuide);
// post /api/guides/ -
router.post("/forgot-password", forgotPasswordGuide);
router.post("/reset-password", resetPasswordGuide);
router.post("/change-password", changePasswordGuide);

// Guide toggles their own availability
router.patch("/me/active", protectGuide, async (req, res) => {
  // force controller to use guide’s own ID
  req.params.id = req.guide._id.toString();
  return updateGuideAvailability(req, res);
});

// admin-only route
router.get("/", protectAdmin, getAllGuides);
router.get("/active", getActiveGuides); // Get only active guides for dropdowns
router.patch("/:id", protectAdmin, updateGuide);
router.patch("/:id/status", protectAdmin, updateGuideStatus);
router.patch("/:id/active", protectAdmin, updateGuideAvailability); // Admin toggles any guide
router.delete("/:id", protectAdmin, deleteGuide); // Delete a guide (Admin only)
router.post("/", protectAdmin, createGuideByAdmin); // Admin creates new guide

export default router;
