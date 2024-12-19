const { Events, ActivityType } = require("discord.js");
const mongoose = require("mongoose");

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    console.log(`[INFO] Discord.js bot is ready!`.green);
    console.log(`[INFO] Logged in as ${client.user.tag}`.blue);

    client.user.setActivity('www.yolobot.xyz', { type: ActivityType.Custom });

    const mongoURI = process.env.MONGO_URI;

    mongoose.set('debug', true);
    console.log("[DEBUG] Attempting to connect to MongoDB...".yellow);
    console.log(`[DEBUG] MongoDB URI: ${mongoURI ? "Provided" : "Not Provided"}`.yellow);

    mongoose.connect(mongoURI, { connectTimeoutMS: 500 })
    .then(() => console.log("[INFO] Connected to MongoDB!".green))
    .catch((err) => console.error(`[ERROR] Failed to connect to MongoDB: ${err.message}`.red));
  },
};
