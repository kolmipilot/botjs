const mongoose = require("mongoose");

const userLevelSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  guildId: { type: String, required: true },
  level: { type: Number, default: 0 },
  exp: { type: Number, default: 0 },
  nextLevelExp: { type: Number, default: 100 },
});

module.exports = mongoose.model("UserLevel", userLevelSchema);
