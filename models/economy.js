const { Schema, model } = require("mongoose");

const economySchema = new Schema({
  guildId: { type: String, required: true },
  symbol: { type: String, default: "$", required: false },
});

module.exports = model("Economy", economySchema);
