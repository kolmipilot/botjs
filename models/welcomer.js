const mongoose = require("mongoose");

const welcomerSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  welcomerChannelId: { type: String, required: true },
  welcomeMessage: {
    title: { type: String, default: "Welcome!" },
    body: { type: String, default: "Hello {user}, welcome to the server!" },
    footer: { type: String, default: "Enjoy your stay!" },
  },
  farewellMessage: {
    title: { type: String, default: "Goodbye!" },
    body: { type: String, default: "Sad to see you go, {user}." },
    footer: { type: String, default: "We hope to see you again." },
  },
});

module.exports = mongoose.model("Welcomer", welcomerSchema);
