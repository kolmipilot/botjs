const mongoose = require("mongoose");

const giveawaySchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  giveawayId: { type: String, required: true },
  name: { type: String, required: false },
  description: { type: String, required: false },
  prize: { type: String, required: true },
  endTime: { type: Date, required: true },
  winnersCount: { type: Number, required: true },
  participants: [String],
  isActive: { type: Boolean, required: true },
  channelId: { type: String, required: true },
});

module.exports = mongoose.model("Giveaway", giveawaySchema);
