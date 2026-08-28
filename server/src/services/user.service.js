import cloudinary from "../config/cloudinary.js";
import User from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";

async function updateProfile(userId, { name }) {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound("User not found");

  if (name) user.name = name;
  await user.save();

  return user.toSafeObject();
}

async function updatePassword(userId, currentPassword, newPassword) {
  const user = await User.findById(userId).select("+password");
  if (!user) throw ApiError.notFound("User not found");

  const isCorrect = await user.comparePassword(currentPassword);
  if (!isCorrect) throw ApiError.unauthorized("Current password is incorrect");

  user.password = newPassword;
  await user.save();

  return { message: "Password updated successfully" };
}

async function uploadAvatar(userId, file) {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound("User not found");

  if (user.avatar?.publicId) {
    await cloudinary.uploader.destroy(user.avatar.publicId).catch(() => {});
  }

  const uploadResult = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `ai-chat-board/avatars/${userId}`, resource_type: "image" },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    stream.end(file.buffer);
  });

  user.avatar = { url: uploadResult.secure_url, publicId: uploadResult.public_id };
  await user.save();

  return user.toSafeObject();
}

function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
      if (!target[key]) Object.assign(target, { [key]: {} });
      deepMerge(target[key], source[key]);
    } else {
      Object.assign(target, { [key]: source[key] });
    }
  }
  return target;
}

async function updateSettings(userId, settingsUpdate) {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound("User not found");

  const currentSettings = user.settings ? user.settings.toObject() : {};
  const mergedSettings = deepMerge(currentSettings, settingsUpdate);
  
  user.settings = mergedSettings;
  await user.save();

  return user.toSafeObject();
}

async function deleteAccount(userId) {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound("User not found");

  user.isDeleted = true;
  await user.save();

  return { message: "Account deactivated successfully" };
}

export default { updateProfile, updatePassword, uploadAvatar, updateSettings, deleteAccount };