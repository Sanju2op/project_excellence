import Enrollment from "../models/enrollment.js";
import Division from "../models/division.js";

// GET /api/enrollments - Get all enrollments
export const getAllEnrollments = async (req, res) => {
  try {
    const enrollments = await Enrollment.find().populate(
      "divisionId",
      "course semester year"
    );
    res.json(enrollments);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET /api/enrollments/division/:divisionId - Get enrollments for a specific division
export const getEnrollmentsByDivision = async (req, res) => {
  try {
    const { divisionId } = req.params;
    const enrollments = await Enrollment.find({ divisionId }).populate(
      "divisionId",
      "course semester year"
    );

    // Enrollment already has isRegistered and studentName
    res.json(enrollments);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// POST /api/enrollments - Create a new enrollment
export const createEnrollment = async (req, res) => {
  try {
    const { divisionId, enrollmentNumber } = req.body;

    if (!divisionId || !enrollmentNumber) {
      return res
        .status(400)
        .json({ message: "Division ID and enrollment number are required" });
    }

    if (!/^[A-Za-z]+\d{7}$/.test(enrollmentNumber)) {
      return res.status(400).json({
        message:
          "Enrollment number must be like BCA2025001 (letters followed by 7 digits)",
      });
    }

    // Check if enrollment already exists
    const existingEnrollment = await Enrollment.findOne({ enrollmentNumber });
    if (existingEnrollment) {
      return res
        .status(400)
        .json({ message: "Enrollment number already exists" });
    }

    const newEnrollment = new Enrollment({
      divisionId,
      enrollmentNumber,
      isRegistered: false,
      studentName: null,
    });

    const savedEnrollment = await newEnrollment.save();
    await savedEnrollment.populate("divisionId", "course semester year");

    res.status(201).json(savedEnrollment);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// POST /api/enrollments/generate - Generate enrollments in range
export const generateEnrollments = async (req, res) => {
  try {
    const { divisionId, start, end } = req.body;

    if (!divisionId || start === undefined || end === undefined) {
      return res
        .status(400)
        .json({ message: "Division ID, start, and end are required" });
    }

    const startNum = parseInt(start);
    const endNum = parseInt(end);

    if (startNum < 1 || endNum < startNum || endNum > 999) {
      return res.status(400).json({
        message:
          "Invalid range! Start must be >= 1, end must be > start and <= 999.",
      });
    }

    const division = await Division.findById(divisionId);
    if (!division) {
      return res.status(404).json({ message: "Division not found" });
    }

    const newEnrollments = [];
    for (let i = startNum; i <= endNum; i++) {
      const enrollmentNumber = `${division.course}${division.year}${i
        .toString()
        .padStart(3, "0")}`;
      const existing = await Enrollment.findOne({ enrollmentNumber });
      if (!existing) {
        newEnrollments.push({
          divisionId,
          enrollmentNumber,
          isRegistered: false,
          studentName: null,
        });
      }
    }

    if (newEnrollments.length === 0) {
      return res.status(400).json({
        message:
          "No new enrollments generated! All numbers in range already exist.",
      });
    }

    const savedEnrollments = await Enrollment.insertMany(newEnrollments);

    res.status(201).json({
      message: `Generated ${savedEnrollments.length} enrollments`,
      enrollments: savedEnrollments,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// DELETE /api/enrollments/:id - Delete a specific enrollment
export const deleteEnrollment = async (req, res) => {
  try {
    const { id } = req.params;
    const enrollment = await Enrollment.findById(id);

    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment not found" });
    }

    // If there's a student with this enrollment, perhaps don't delete or handle
    // For now, allow deletion
    await Enrollment.findByIdAndDelete(id);

    res.json({ message: "Enrollment deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// DELETE /api/enrollments/division/:divisionId - Delete all enrollments for a division
export const deleteAllEnrollmentsByDivision = async (req, res) => {
  try {
    const { divisionId } = req.params;

    const result = await Enrollment.deleteMany({ divisionId });

    res.json({ message: `Deleted ${result.deletedCount} enrollments` });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
