const mongoose = require("mongoose");

const guildSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  logChannelId: { type: String, required: false },
  archiveChannelId: { type: String, required: false },
  enabledSystems: {
    autoMod: { type: Boolean, default: false },
    giveaway: { type: Boolean, default: false },
    logs: { type: Boolean, default: false },
    selfrole: { type: Boolean, default: false },
    ticket: { type: Boolean, default: false },
    welcomer: { type: Boolean, default: false },
    level: { type: Boolean, default: false },
    economy: { type: Boolean, default: false },
    events: { type: Boolean, default: false },
  },
});

module.exports = mongoose.model("Guild", guildSchema);
