const { Schema, model } = require("mongoose");

const userEconomySchema = new Schema({
  userId: { type: String, required: true },
  guildId: { type: String, required: true },
  wallet: { type: Number, default: 0 }, // Portfel
  bank: { type: Number, default: 0 }, // Bank
  inventory: { type: Array, default: [] },
});

module.exports = model("UserEconomy", userEconomySchema);
