const { Schema, model } = require("mongoose");

const autoModSchema = new Schema({
  guildId: { type: String, required: true },
  channelId: { type: String, required: true },
  enabledFeatures: {
    linkRemover: { type: Boolean, default: false },
    antiSpam: { type: Boolean, default: false },
    wordCensorship: { type: Boolean, default: false },
    capsLockDetector: { type: Boolean, default: false },
    emojiManager: { type: Boolean, default: false },
  },
  domains: [String],
  bannedWords: [String],
  emojiLimit: { type: Number, required: false },
});

module.exports = model("AutoMod", autoModSchema);
