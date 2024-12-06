const mongoose = require("mongoose");

const eventsschema = new mongoose.Schema({
  guildId: { type: String, required: true },
  eventChannelId: { type: String, required: true },
});

module.exports = mongoose.model("Events", eventsschema);
