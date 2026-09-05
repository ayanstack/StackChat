import mongoose from "mongoose";
import { connectDB } from "../database/connect.js";
import User from "../models/user.model.js";
import { USER_ROLES } from "../constants/enums.js";

async function setAdmin() {
  const targetEmail = process.argv[2];
  const targetRole = process.argv[3] || USER_ROLES.ADMIN;

  if (!targetEmail) {
    console.error("❌ Usage: node src/scripts/setAdmin.js <email> [role]");
    console.error("Example: node src/scripts/setAdmin.js ayanshaikh15082007@gmail.com admin");
    process.exit(1);
  }

  try {
    await connectDB();

    const normalizedEmail = targetEmail.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      console.error(`❌ No user found with email: ${normalizedEmail}`);
      process.exit(1);
    }

    user.role = targetRole;
    await user.save();

    console.log(`✅ SUCCESS: User "${user.name}" (${user.email}) is now "${user.role}"!`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error setting role:", error.message);
    process.exit(1);
  }
}

setAdmin();
