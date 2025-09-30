import mongoose from "mongoose";

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      maxlength: 100,
      trim: true,
    },
    guide: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Guide",
      required: true,
    },
    projectTitle: {
      type: String,
      required: true,
      maxlength: 200,
      trim: true,
    },
    projectDescription: {
      type: String,
      required: true,
      maxlength: 1000,
      trim: true,
    },
    projectTechnology: {
      type: String,
      required: true,
      maxlength: 100,
      trim: true,
    },
    year: {
      type: Number,
      required: true,
      min: 2020,
      max: 2030,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Enrollment",
      },
    ],
    status: {
      type: String,
      enum: ["Not Started", "In Progress", "Completed"],
      default: "Not Started",
    },
  },
  { timestamps: true }
);

const Group = mongoose.model("Group", groupSchema);
export default Group;
