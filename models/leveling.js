const { Schema, model } = require("mongoose");

const levelingSchema = new Schema({
  guildId: { type: String, required: true },
  channelId: { type: String, required: true },
});

module.exports = model("Leveling", levelingSchema);
