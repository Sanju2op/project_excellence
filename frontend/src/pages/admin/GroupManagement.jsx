import React, { useState, useEffect, useRef } from "react";
import {
  ChevronLeft,
  Users,
  User,
  BookOpen,
  Smartphone,
  Code,
  Hash,
  Trash2,
  Edit,
  X,
  ChevronDown,
  Plus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// Reusable Dropdown component for filters and student selection
const FilterDropdown = ({
  title,
  options,
  selected,
  onSelect,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleSelect = (option) => {
    onSelect(option);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between px-4 py-2 bg-white/10 text-white rounded-lg font-semibold transition-all duration-200 hover:bg-white/20 shadow-neumorphic border border-white/20 backdrop-blur-sm w-40 appearance-none cursor-pointer"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2300b8d4'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 0.5rem center",
          backgroundSize: "1.5em",
        }}
        aria-label={`Select ${title}`}
      >
        <span>{selected || title}</span>
        <ChevronDown
          size={20}
          className={`transform transition-transform duration-200 ${isOpen ? "rotate-180" : "rotate-0"
            } text-accent-teal`}
        />
      </button>
      {isOpen && (
        <div className="absolute top-12 left-0 w-48 bg-white/10 rounded-lg shadow-neumorphic border border-white/20 z-10 transition-all duration-200 backdrop-blur-sm animate-fade-in">
          <ul className="py-2">
            {options.map((option, index) => (
              <li
                key={index}
                onClick={() => handleSelect(option)}
                onKeyPress={(e) => e.key === "Enter" && handleSelect(option)}
                className={`px-4 py-2 cursor-pointer transition-colors duration-200 text-white ${selected === option
                  ? "bg-accent-teal font-bold"
                  : "hover:bg-accent-teal/50"
                  }`}
                tabIndex={0}
              >
                {option}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

function GroupManagement() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [guides, setGuides] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showChangeGuideModal, setShowChangeGuideModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showDeleteStudentModal, setShowDeleteStudentModal] = useState(false);
  const [newGuide, setNewGuide] = useState("");
  const [newStudent, setNewStudent] = useState("");
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedClassFilter, setSelectedClassFilter] = useState("All");
  const [selectedYearFilter, setSelectedYearFilter] = useState(
    new Date().getFullYear().toString()
  );
  const [availableStudents, setAvailableStudents] = useState([]);

  // Replace with your actual admin token retrieval logic
  const adminToken = localStorage.getItem("token");

  // API base URL
  const API_BASE_URL = "http://localhost:5000/api";

  // Fetch all initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${adminToken}` };

        // Fetch guides
        const guidesResponse = await axios.get(
          `${API_BASE_URL}/guides/active`,
          { headers }
        );
        setGuides(Array.isArray(guidesResponse.data) ? guidesResponse.data : []);

        // Fetch groups with filters
        const groupsResponse = await axios.get(`${API_BASE_URL}/groups`, {
          headers,
          params: {
            course:
              selectedClassFilter !== "All"
                ? selectedClassFilter.split(" ")[0]
                : undefined,
            year:
              selectedYearFilter !== "All Years"
                ? selectedYearFilter
                : undefined,
          },
        });
        setGroups(groupsResponse.data);

        // Fetch divisions
        const divisionsResponse = await axios.get(`${API_BASE_URL}/divisions`, {
          headers,
        });
        setDivisions(divisionsResponse.data);
      } catch (error) {
        setErrorMessage("Failed to fetch data. Please try again.");
        setTimeout(() => setErrorMessage(""), 3000);
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [selectedClassFilter, selectedYearFilter, adminToken]);

  // Filter options
  const allClassNames = [
    "All",
    ...new Set(
      divisions.map((division) => `${division.course} ${division.semester}`)
    ),
  ];
  const allYears = [
    "All Years",
    ...new Set(divisions.map((division) => division.year.toString())),
  ]
    .sort()
    .reverse();

  // Get active guides
  const activeGuides = guides.filter(
    (guide) => guide.status === "approved" && guide.isActive === true
  );

  // Get available students for a group
  const getAvailableStudents = async () => {
    if (!selectedGroup) return [];
    try {
      const headers = { Authorization: `Bearer ${adminToken}` };
      const response = await axios.get(
        `${API_BASE_URL}/groups/${selectedGroup._id}/students/available`,
        { headers }
      );
      return response.data;
    } catch (error) {
      setErrorMessage("Failed to fetch available students.");
      setTimeout(() => setErrorMessage(""), 3000);
      console.error("Error fetching available students:", error);
      console.error("Error response:", error.response?.data);
      return [];
    }
  };

  // Handlers
  const handleBack = () => {
    navigate("/admin/dashboard", { replace: true });
  };

  const handleViewDetails = async (group) => {
    try {
      const headers = { Authorization: `Bearer ${adminToken}` };
      const response = await axios.get(`${API_BASE_URL}/groups/${group._id}`, {
        headers,
      });
      setSelectedGroup(response.data);
    } catch (error) {
      setErrorMessage("Failed to fetch group details.");
      setTimeout(() => setErrorMessage(""), 3000);
      console.error("Error fetching group details:", error);
    }
  };

  const handleBackToList = () => {
    setSelectedGroup(null);
  };

  const getGuideDetails = (guideName) => {
    return guides.find((guide) => guide.name === guideName) || {};
  };

  const openChangeGuideModal = () => {
    setNewGuide(selectedGroup.guide.name);
    setShowChangeGuideModal(true);
  };

  const handleSaveGuideChange = async () => {
    try {
      const headers = { Authorization: `Bearer ${adminToken}` };
      const guideId = guides.find((guide) => guide.name === newGuide)?._id;
      await axios.put(
        `${API_BASE_URL}/groups/${selectedGroup._id}`,
        { guide: guideId },
        { headers }
      );
      setGroups(
        groups.map((group) =>
          group._id === selectedGroup._id
            ? { ...group, guide: { name: newGuide } }
            : group
        )
      );
      setSelectedGroup((prev) => ({ ...prev, guide: { name: newGuide } }));
      setShowChangeGuideModal(false);
      setSuccessMessage(
        `Guide for ${selectedGroup.name} changed successfully!`
      );
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      setErrorMessage("Failed to change guide.");
      setTimeout(() => setErrorMessage(""), 3000);
      console.error("Error changing guide:", error);
    }
  };

  const handleDeleteGroup = async () => {
    try {
      const headers = { Authorization: `Bearer ${adminToken}` };
      const deletedGroupName = selectedGroup.name;
      await axios.delete(`${API_BASE_URL}/groups/${selectedGroup._id}`, {
        headers,
      });
      setGroups(groups.filter((group) => group._id !== selectedGroup._id));
      setSelectedGroup(null);
      setShowDeleteModal(false);
      setSuccessMessage(`Group "${deletedGroupName}" deleted successfully!`);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      setErrorMessage("Failed to delete group.");
      setTimeout(() => setErrorMessage(""), 3000);
      console.error("Error deleting group:", error);
    }
  };

  const handleAddStudent = async () => {
    if (selectedGroup.members.length >= 4) {
      setSuccessMessage("Cannot add more than 4 students to a group!");
      setTimeout(() => setSuccessMessage(""), 3000);
      return;
    }
    if (!newStudent) {
      setSuccessMessage("Please select a student to add!");
      setTimeout(() => setSuccessMessage(""), 3000);
      return;
    }
    try {
      const headers = { Authorization: `Bearer ${adminToken}` };
      const studentData = (await getAvailableStudents()).find(
        (s) => s.enrollmentNumber === newStudent
      );
      if (!studentData) {
        setSuccessMessage("Selected student is not available!");
        setTimeout(() => setSuccessMessage(""), 3000);
        return;
      }
      const newMember = {
        name: studentData.name,
        enrollment: studentData.enrollmentNumber,
        className: studentData.className,
      };
      const updatedMembers = [...selectedGroup.members, newMember];
      await axios.put(
        `${API_BASE_URL}/groups/${selectedGroup._id}`,
        { members: updatedMembers },
        { headers }
      );
      setGroups(
        groups.map((group) =>
          group._id === selectedGroup._id
            ? { ...group, members: updatedMembers }
            : group
        )
      );
      setSelectedGroup((prev) => ({ ...prev, members: updatedMembers }));
      setShowAddStudentModal(false);
      setNewStudent("");
      setSuccessMessage(
        `Student ${studentData.name} added to ${selectedGroup.name}!`
      );
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      setErrorMessage("Failed to add student.");
      setTimeout(() => setErrorMessage(""), 3000);
      console.error("Error adding student:", error);
    }
  };

  const handleDeleteStudent = async () => {
    if (selectedGroup.members.length <= 3) {
      setSuccessMessage("Cannot remove student: Minimum 3 students required!");
      setTimeout(() => setSuccessMessage(""), 3000);
      setShowDeleteStudentModal(false);
      return;
    }
    try {
      const headers = { Authorization: `Bearer ${adminToken}` };
      const updatedMembers = selectedGroup.members.filter(
        (m) => m.enrollment !== studentToDelete.enrollment
      );
      await axios.put(
        `${API_BASE_URL}/groups/${selectedGroup._id}`,
        { members: updatedMembers },
        { headers }
      );
      setGroups(
        groups.map((group) =>
          group._id === selectedGroup._id
            ? { ...group, members: updatedMembers }
            : group
        )
      );
      setSelectedGroup((prev) => ({ ...prev, members: updatedMembers }));
      setShowDeleteStudentModal(false);
      setSuccessMessage(
        `Student ${studentToDelete.name} removed from ${selectedGroup.name}!`
      );
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      setErrorMessage("Failed to remove student.");
      setTimeout(() => setErrorMessage(""), 3000);
      console.error("Error removing student:", error);
    }
  };

  // Fetch available students when modal opens
  const handleOpenAddStudentModal = async () => {
    setShowAddStudentModal(true);
    setNewStudent("");
    setAvailableStudents([]);

    if (selectedGroup) {
      try {
        // If group has no members, we need to provide course/semester info
        if (!selectedGroup.members || selectedGroup.members.length === 0) {
          // Use filter values as fallback
          const course = selectedClassFilter !== "All" ? selectedClassFilter.split(" ")[0] : "MCA";
          const semester = selectedClassFilter !== "All" ? parseInt(selectedClassFilter.split(" ")[1]) : 3;
          const year = selectedYearFilter !== "All Years" ? parseInt(selectedYearFilter) : 2024;

          const headers = { Authorization: `Bearer ${adminToken}` };
          const response = await axios.get(
            `${API_BASE_URL}/groups/${selectedGroup._id}/students/available`,
            {
              headers,
              params: { course, semester, year }
            }
          );
          setAvailableStudents(response.data);
        } else {
          const students = await getAvailableStudents();
          setAvailableStudents(students);
        }
      } catch (error) {
        console.error("Error fetching available students:", error);
        setErrorMessage("Failed to fetch available students. Please try again.");
        setTimeout(() => setErrorMessage(""), 3000);
      }
    }
  };

  // Render details view
  const renderDetailsView = () => {
    const guideDetails = getGuideDetails(selectedGroup.guide.name);
    const hasMembers =
      selectedGroup.members && selectedGroup.members.length > 0;

    return (
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={handleBackToList}
            className="flex items-center bg-gradient-to-r from-accent-teal to-cyan-500 text-white py-2 px-4 sm:px-3 rounded-lg font-semibold hover:bg-opacity-90 hover:scale-105 transition duration-200 shadow-neumorphic border border-white/20 backdrop-blur-sm animate-pulse-once"
            aria-label="Back to groups list"
          >
            <ChevronLeft size={20} className="mr-2" /> Back to Groups
          </button>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white drop-shadow-lg flex-grow text-center tracking-tight">
            {selectedGroup.name}
          </h1>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center bg-red-500/80 text-white py-2 px-4 sm:px-3 rounded-lg font-semibold hover:bg-red-600 hover:scale-105 transition duration-200 shadow-neumorphic border border-white/20 backdrop-blur-sm animate-pulse-once"
            aria-label="Delete group"
          >
            <Trash2 size={20} className="mr-2" /> Delete Group
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-light-glass backdrop-blur-sm p-6 rounded-xl shadow-neumorphic border border-white/30">
            <h2 className="text-2xl font-bold text-accent-teal mb-4">
              Project Details
            </h2>
            <div className="space-y-4 text-white/90">
              <div className="flex items-center">
                <BookOpen
                  size={20}
                  className="mr-3 text-accent-teal animate-icon-pulse"
                />
                <p className="font-semibold">Project Title:</p>
                <span className="ml-2">{selectedGroup.projectTitle}</span>
              </div>
              <div className="flex items-center">
                <Users
                  size={20}
                  className="mr-3 text-accent-teal animate-icon-pulse"
                />
                <p className="font-semibold">Course:</p>
                <span className="ml-2">
                  {selectedGroup.members[0]?.className}
                </span>
              </div>
              <div className="flex items-center">
                <span className="text-accent-teal text-lg mr-3">🗓️</span>
                <p className="font-semibold">Year:</p>
                <span className="ml-2">{selectedGroup.year}</span>
              </div>
              <div className="flex items-center">
                <Code
                  size={20}
                  className="mr-3 text-accent-teal animate-icon-pulse"
                />
                <p className="font-semibold">Technology:</p>
                <span className="ml-2">{selectedGroup.projectTechnology}</span>
              </div>
              <div>
                <p className="font-semibold mb-1">Description:</p>
                <p className="text-sm">{selectedGroup.projectDescription}</p>
              </div>
            </div>
          </div>

          <div className="bg-light-glass backdrop-blur-sm p-6 rounded-xl shadow-neumorphic border border-white/30">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-accent-teal">
                Guide Details
              </h2>
              <button
                onClick={openChangeGuideModal}
                className="flex items-center bg-gradient-to-r from-accent-teal to-cyan-500 text-white py-2 px-4 sm:px-3 rounded-lg font-semibold hover:bg-opacity-90 hover:scale-105 transition duration-200 shadow-neumorphic border border-white/20 backdrop-blur-sm animate-pulse-once"
                aria-label="Change guide"
              >
                <Edit size={20} className="mr-2" /> Change Guide
              </button>
            </div>
            <div className="space-y-4 text-white/90">
              <div className="flex items-center">
                <User
                  size={20}
                  className="mr-3 text-accent-teal animate-icon-pulse"
                />
                <p className="font-semibold">Name:</p>
                <span className="ml-2">{guideDetails.name}</span>
              </div>
              <div className="flex items-center">
                <Code
                  size={20}
                  className="mr-3 text-accent-teal animate-icon-pulse"
                />
                <p className="font-semibold">Expertise:</p>
                <span className="ml-2">{guideDetails.expertise}</span>
              </div>
              <div className="flex items-center">
                <Smartphone
                  size={20}
                  className="mr-3 text-accent-teal animate-icon-pulse"
                />
                <p className="font-semibold">Mobile:</p>
                <span className="ml-2">{guideDetails.mobile}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-light-glass backdrop-blur-sm p-6 rounded-xl shadow-neumorphic border border-white/30 mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-accent-teal">
              Group Members
            </h2>
            <button
              onClick={handleOpenAddStudentModal}
              className="flex items-center bg-gradient-to-r from-accent-teal to-cyan-500 text-white py-2 px-4 sm:px-3 rounded-lg font-semibold transition duration-200 shadow-neumorphic border border-white/20 backdrop-blur-sm animate-pulse-once hover:bg-opacity-90 hover:scale-105"
              aria-label="Add student"
            >
              <Plus size={20} className="mr-2" /> Add Student
            </button>
          </div>
          <div className="flex flex-col space-y-4">
            {selectedGroup.members.map((member, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-white/10 p-4 rounded-lg border border-white/20"
              >
                <div className="flex items-center">
                  <User
                    size={24}
                    className="text-accent-teal mr-4 animate-icon-pulse"
                  />
                  <div className="flex flex-col">
                    <span className="font-semibold text-lg text-white">
                      {member.name}
                    </span>
                    <div className="text-sm text-white/80 flex items-center">
                      <Hash size={16} className="mr-1 text-accent-teal" />
                      <span>{member.enrollment}</span>
                      <span className="ml-4">{member.className}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setStudentToDelete(member);
                    setShowDeleteStudentModal(true);
                  }}
                  className="text-red-400 hover:text-red-300 transition-colors duration-200"
                  aria-label={`Remove student ${member.name}`}
                >
                  <Trash2 size={24} className="animate-icon-pulse" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render list view
  const renderListView = () => {
    return (
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={handleBack}
            className="flex items-center bg-gradient-to-r from-accent-teal to-cyan-500 text-white py-2 px-4 sm:px-3 rounded-lg font-semibold hover:bg-opacity-90 hover:scale-105 transition duration-200 shadow-neumorphic border border-white/20 backdrop-blur-sm animate-pulse-once"
            aria-label="Back to dashboard"
          >
            <ChevronLeft size={20} className="mr-2" /> Back to Dashboard
          </button>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white drop-shadow-lg flex-grow text-center tracking-tight">
            Manage Groups
          </h1>
          <div className="w-[200px]"></div> {/* Spacer for alignment */}
        </div>

        <div className="flex flex-wrap gap-4 mb-6 justify-center">
          <FilterDropdown
            title="Courses"
            options={allClassNames}
            selected={selectedClassFilter}
            onSelect={setSelectedClassFilter}
          />
          <FilterDropdown
            title="Years"
            options={allYears}
            selected={selectedYearFilter}
            onSelect={setSelectedYearFilter}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.length > 0 ? (
            groups.map((group, index) => (
              <div
                key={group._id}
                onClick={() => handleViewDetails(group)}
                className="bg-light-glass backdrop-blur-sm p-6 rounded-xl shadow-neumorphic border border-white/30 flex flex-col justify-between cursor-pointer hover:scale-[1.02] hover:bg-white/20 transition-all duration-200 animate-fade-in"
                style={{ animationDelay: `${index * 0.15}s` }}
                aria-label={`View details for ${group.name}`}
              >
                <div>
                  <div className="flex items-center text-xl font-bold text-accent-teal mb-2">
                    <Users size={24} className="mr-3 animate-icon-pulse" />
                    <span className="text-white">{group.name}</span>
                  </div>
                  <div className="space-y-2 text-white/90">
                    <div className="flex items-center">
                      <BookOpen
                        size={20}
                        className="mr-3 text-accent-teal animate-icon-pulse"
                      />
                      <p className="font-semibold">Project Title:</p>
                      <span className="ml-2">{group.projectTitle}</span>
                    </div>
                    <div className="flex items-center">
                      <User
                        size={20}
                        className="mr-3 text-accent-teal animate-icon-pulse"
                      />
                      <p className="font-semibold">Guide:</p>
                      <span className="ml-2">{group.guide.name}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-white/70 text-center col-span-full py-8 text-lg">
              No groups found.
            </p>
          )}
        </div>
      </div>
    );
  };

  // Main component render
  return (
    <div className="min-h-screen flex flex-col items-center p-4 sm:p-6 bg-gradient-to-br from-gray-900 to-teal-900 font-sans text-white">
      <style>
        {`
          @keyframes fade-in {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes pulse-once {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
          @keyframes icon-pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
          }
          .animate-fade-in {
            animation: fade-in 0.6s ease-out;
          }
          .animate-pulse-once {
            animation: pulse-once 0.5s ease-in-out;
          }
          .animate-icon-pulse {
            animation: icon-pulse 2s infinite ease-in-out;
          }
          .bg-particles {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 800'%3E%3Ccircle fill='%2300b8d4' cx='100' cy='100' r='5'/%3E%3Ccircle fill='%2300b8d4' cx='700' cy='200' r='4'/%3E%3Ccircle fill='%2300b8d4' cx='300' cy='600' r='6'/%3E%3Ccircle fill='%2300b8d4' cx='500' cy='400' r='5'/%3E%3C/svg%3E") repeat;
            opacity: 0.1;
          }
          .guide-select option, .student-select option {
            color: white;
            background: rgba(0, 0, 0, 0.8);
          }
        `}
      </style>
      <div className="bg-particles" />
      {successMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-gradient-to-r from-accent-teal to-cyan-500 text-white font-semibold px-6 py-3 rounded-lg shadow-neumorphic border border-white/20 backdrop-blur-sm z-50 animate-fade-in">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-red-500/80 text-white font-semibold px-6 py-3 rounded-lg shadow-neumorphic border border-white/20 backdrop-blur-sm z-50 animate-fade-in">
          {errorMessage}
        </div>
      )}

      {selectedGroup ? renderDetailsView() : renderListView()}

      {/* Change Guide Modal */}
      {showChangeGuideModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-light-glass backdrop-blur-sm p-8 rounded-2xl shadow-neumorphic border border-white/20 w-full max-w-sm relative transform transition-all duration-200 scale-100 hover:scale-102">
            <button
              onClick={() => setShowChangeGuideModal(false)}
              className="absolute top-4 right-4 text-white/70 hover:text-white transition duration-200"
              aria-label="Close modal"
            >
              <X size={24} className="animate-icon-pulse" />
            </button>
            <h2 className="text-2xl font-bold text-white mb-6 text-center tracking-tight">
              Change Guide
            </h2>
            <label
              htmlFor="new-guide-select"
              className="block text-white text-sm font-semibold mb-2"
            >
              Select a new guide
            </label>
            <div className="relative">
              <select
                id="new-guide-select"
                className="guide-select w-full p-3 bg-white/10 text-white rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-accent-teal transition-all duration-200 shadow-neumorphic backdrop-blur-sm appearance-none cursor-pointer pr-8"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2300b8d4'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 0.5rem center",
                  backgroundSize: "1.5em",
                }}
                value={newGuide}
                onChange={(e) => setNewGuide(e.target.value)}
              >
                {activeGuides.map((guide) => (
                  <option key={guide._id} value={guide.name}>
                    {guide.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <button
                type="button"
                onClick={() => setShowChangeGuideModal(false)}
                className="flex items-center bg-gray-600/80 text-white py-2 px-4 sm:px-3 rounded-lg font-semibold hover:bg-gray-700 hover:scale-105 transition duration-200 shadow-neumorphic border border-white/20 backdrop-blur-sm animate-pulse-once"
                aria-label="Cancel changing guide"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveGuideChange}
                className="flex items-center bg-gradient-to-r from-accent-teal to-cyan-500 text-white py-2 px-4 sm:px-3 rounded-lg font-semibold hover:bg-opacity-90 hover:scale-105 transition duration-200 shadow-neumorphic border border-white/20 backdrop-blur-sm animate-pulse-once"
                aria-label="Change guide"
              >
                Change
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddStudentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-light-glass backdrop-blur-sm p-8 rounded-2xl shadow-neumorphic border border-white/20 w-full max-w-sm relative transform transition-all duration-200 scale-100 hover:scale-102">
            <button
              onClick={() => setShowAddStudentModal(false)}
              className="absolute top-4 right-4 text-white/70 hover:text-white transition duration-200"
              aria-label="Close modal"
            >
              <X size={24} className="animate-icon-pulse" />
            </button>
            <h2 className="text-2xl font-bold text-white mb-6 text-center tracking-tight">
              Add Student
            </h2>
            <label
              htmlFor="new-student-select"
              className="block text-white text-sm font-semibold mb-2"
            >
              Select a student
            </label>
            <div className="relative">
              <select
                id="new-student-select"
                className="student-select w-full p-3 bg-white/10 text-white rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-accent-teal transition-all duration-200 shadow-neumorphic backdrop-blur-sm appearance-none cursor-pointer pr-8"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2300b8d4'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 0.5rem center",
                  backgroundSize: "1.5em",
                }}
                value={newStudent}
                onChange={(e) => setNewStudent(e.target.value)}
              >
                <option value="">Select a student</option>
                {availableStudents.length > 0 ? (
                  availableStudents.map((student) => (
                    <option
                      key={student.enrollmentNumber}
                      value={student.enrollmentNumber}
                    >
                      {student.name} ({student.enrollmentNumber})
                    </option>
                  ))
                ) : (
                  <option value="" disabled>
                    No eligible students available
                  </option>
                )}
              </select>
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <button
                type="button"
                onClick={() => setShowAddStudentModal(false)}
                className="flex items-center bg-gray-600/80 text-white py-2 px-4 sm:px-3 rounded-lg font-semibold hover:bg-gray-700 hover:scale-105 transition duration-200 shadow-neumorphic border border-white/20 backdrop-blur-sm animate-pulse-once"
                aria-label="Cancel adding student"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddStudent}
                className="flex items-center bg-gradient-to-r from-accent-teal to-cyan-500 text-white py-2 px-4 sm:px-3 rounded-lg font-semibold hover:bg-opacity-90 hover:scale-105 transition duration-200 shadow-neumorphic border border-white/20 backdrop-blur-sm animate-pulse-once"
                aria-label="Add student"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Student Confirmation Modal */}
      {showDeleteStudentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-light-glass backdrop-blur-sm p-8 rounded-2xl shadow-neumorphic border border-white/20 w-full max-w-sm relative transform transition-all duration-200 scale-100 hover:scale-102">
            <button
              onClick={() => setShowDeleteStudentModal(false)}
              className="absolute top-4 right-4 text-white/70 hover:text-white transition duration-200"
              aria-label="Close modal"
            >
              <X size={24} className="animate-icon-pulse" />
            </button>
            <h2 className="text-2xl font-bold text-white mb-6 text-center tracking-tight">
              Confirm Removal
            </h2>
            <p className="text-white/80 text-center mb-6">
              Are you sure you want to remove{" "}
              <span className="font-semibold text-accent-teal">
                {studentToDelete.name}
              </span>{" "}
              from{" "}
              <span className="font-semibold text-accent-teal">
                {selectedGroup.name}
              </span>
              ? This action cannot be undone.
            </p>
            <div className="flex justify-center gap-4 mt-6">
              <button
                onClick={() => setShowDeleteStudentModal(false)}
                className="flex items-center bg-gray-600/80 text-white py-2 px-4 sm:px-3 rounded-lg font-semibold hover:bg-gray-700 hover:scale-105 transition duration-200 shadow-neumorphic border border-white/20 backdrop-blur-sm animate-pulse-once"
                aria-label="Cancel removing student"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteStudent}
                className="flex items-center bg-red-500/80 text-white py-2 px-4 sm:px-3 rounded-lg font-semibold hover:bg-red-600 hover:scale-105 transition duration-200 shadow-neumorphic border border-white/20 backdrop-blur-sm animate-pulse-once"
                aria-label="Remove student"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Group Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-light-glass backdrop-blur-sm p-8 rounded-2xl shadow-neumorphic border border-white/20 w-full max-w-sm relative transform transition-all duration-200 scale-100 hover:scale-102">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="absolute top-4 right-4 text-white/70 hover:text-white transition duration-200"
              aria-label="Close modal"
            >
              <X size={24} className="animate-icon-pulse" />
            </button>
            <h2 className="text-2xl font-bold text-white mb-6 text-center tracking-tight">
              Confirm Deletion
            </h2>
            <p className="text-white/80 text-center mb-6">
              Are you sure you want to delete the group{" "}
              <span className="font-semibold text-accent-teal">
                "{selectedGroup.name}"
              </span>
              ? This action cannot be undone.
            </p>
            <div className="flex justify-center gap-4 mt-6">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex items-center bg-gray-600/80 text-white py-2 px-4 sm:px-3 rounded-lg font-semibold hover:bg-gray-700 hover:scale-105 transition duration-200 shadow-neumorphic border border-white/20 backdrop-blur-sm animate-pulse-once"
                aria-label="Cancel deleting group"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteGroup}
                className="flex items-center bg-red-500/80 text-white py-2 px-4 sm:px-3 rounded-lg font-semibold hover:bg-red-600 hover:scale-105 transition duration-200 shadow-neumorphic border border-white/20 backdrop-blur-sm animate-pulse-once"
                aria-label="Delete group"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GroupManagement;
