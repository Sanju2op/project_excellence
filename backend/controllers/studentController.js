import Division from "../models/division.js";
import Enrollment from "../models/enrollment.js";

// GET /api/students - Get all students (using Enrollment)
export const getAllStudents = async (req, res) => {
  try {
    const students = await Enrollment.find({ isRegistered: true }).populate(
      "divisionId",
      "course semester year"
    );
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET /api/students/available - Get students not in any group (using Enrollment)
export const getAvailableStudents = async (req, res) => {
  try {
    const { course, semester, year } = req.query;
    let filter = {};

    if (course) filter.course = course;
    if (semester) filter.semester = semester;
    if (year) filter.year = year;

    // Get all groups and their members
    const Group = (await import("../models/group.js")).default;
    const groups = await Group.find({});
    const assignedEnrollments = groups.flatMap((g) =>
      g.members.map((m) => m.enrollmentNumber)
    );

    // Get divisions
    const divisions = await Division.find(filter);
    const divisionIds = divisions.map((d) => d._id);

    // Get enrollments not assigned to groups
    const enrollments = await Enrollment.find({
      divisionId: { $in: divisionIds },
      enrollmentNumber: { $nin: assignedEnrollments },
      isRegistered: true,
    }).populate("divisionId", "course semester year");

    res.json(enrollments);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
