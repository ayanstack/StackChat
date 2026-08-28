import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { USER_ROLES } from "../constants/enums.js";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: 2,
      maxlength: 50,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },

    password: {
      type: String,
      required: function () {
        return !this.googleId;
      },
      minlength: 8,
      select: false,
    },

    // Google OAuth
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },

    avatar: {
      url: {
        type: String,
        default: "",
      },
      publicId: {
        type: String,
        default: "",
      },
    },

    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.USER,
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    // Password reset
    passwordResetToken: {
      type: String,
      select: false,
    },

    passwordResetExpires: {
      type: Date,
      select: false,
    },

    // Email verification
    emailVerificationToken: {
      type: String,
      select: false,
    },

    emailVerificationExpires: {
      type: Date,
      select: false,
    },

    settings: {
      profile: {
        bio: { type: String, default: "", maxlength: 500 },
        timezone: { type: String, default: "UTC" },
        locale: { type: String, default: "en-US" },
      },
      appearance: {
        theme: { type: String, enum: ["light", "dark", "system"], default: "system" },
        accentColor: { type: String, default: "blue" },
        layout: { type: String, enum: ["compact", "comfortable"], default: "comfortable" },
      },
      chat: {
        enterToSend: { type: Boolean, default: true },
        markdownEnabled: { type: Boolean, default: true },
        codeBlocksEnabled: { type: Boolean, default: true },
        autoScroll: { type: Boolean, default: true },
        streamingPreference: { type: Boolean, default: true },
        responseLength: { type: String, enum: ["short", "normal", "long"], default: "normal" },
      },
      ai: {
        defaultModel: { type: String, default: "gpt-4o-mini" },
        defaultSystemPrompt: { type: String, default: "" },
        temperature: { type: Number, default: 0.7, min: 0, max: 2 },
        maxOutputTokens: { type: Number, default: 2048, min: 100, max: 100000 },
        responseStyle: { type: String, enum: ["creative", "balanced", "precise"], default: "balanced" },
        preferredLanguage: { type: String, default: "en" },
      },
      privacy: {
        chatHistoryEnabled: { type: Boolean, default: true },
        personalizationEnabled: { type: Boolean, default: true },
        analyticsEnabled: { type: Boolean, default: true },
        dataSharingEnabled: { type: Boolean, default: false },
      },
      notifications: {
        securityAlerts: { type: Boolean, default: true },
        emailNotifications: { type: Boolean, default: true },
        productUpdates: { type: Boolean, default: false },
        generationNotifications: { type: Boolean, default: false },
      },
      accessibility: {
        reducedMotion: { type: Boolean, default: false },
        fontSize: { type: String, enum: ["small", "medium", "large"], default: "medium" },
        highContrast: { type: Boolean, default: false },
      },
    },
  },
  {
    timestamps: true,
  }
);

// =====================================================
// HASH PASSWORD
// =====================================================

userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) {
    return next();
  }

  try {
    this.password = await bcrypt.hash(this.password, 10);
    next();
  } catch (error) {
    next(error);
  }
});

// =====================================================
// COMPARE PASSWORD
// =====================================================

userSchema.methods.comparePassword = async function (plainPassword) {
  if (!this.password) {
    return false;
  }

  return bcrypt.compare(plainPassword, this.password);
};

// =====================================================
// SAFE USER OBJECT
// =====================================================

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();

  delete obj.password;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  delete obj.emailVerificationToken;
  delete obj.emailVerificationExpires;

  return obj;
};

const User = mongoose.model("User", userSchema);

export default User;