import mongoose from "mongoose";

const folderSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        name: {
            type: String,
            required: [true, "Folder name is required"],
            trim: true,
            maxlength: 100,
        },
        color: {
            type: String,
            default: "#6366f1",
        },
    },
    { timestamps: true }
)

folderSchema.index({user: 1})

const Folder = mongoose.model("Folder", folderSchema)

export default Folder
