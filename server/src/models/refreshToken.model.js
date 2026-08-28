import mongoose from "mongoose";

const refreshTokenSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        token: {
            type: String,
            required: true,
            unique: true,
        },
        userAgent: { type: String, default: "" },
        ip: { type: String, default: "" },
        expiresAt: {
            type: Date,
            required: true,
        },
        isRevoked: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
)
refreshTokenSchema.index({ expiresAt: 1 }, {expireAfterSeconds : 0})

const RefreshToken = mongoose.model("Refreshtoken", refreshTokenSchema)

export default RefreshToken