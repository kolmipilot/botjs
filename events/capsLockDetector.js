const { Events, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const AutoMod = require("../models/automod");
const mConfig = require("../messageConfig.json");

module.exports = {
  name: Events.MessageCreate,
  async execute(client, message) {
    const autoModData = await AutoMod.findOne({ guildId: message.guild.id });
    if (!autoModData || !autoModData.enabledFeatures.capsLockDetector) return;

    if (
      message.author.bot ||
      message.member.permissions.has(PermissionFlagsBits.Administrator)
    )
      return;

    const messageContent = message.content;
    const capsCount = messageContent.replace(/[^A-Z]/g, "").length;
    const capsRatio = capsCount / messageContent.length;

    if (capsRatio > 0.7 && messageContent.length > 10) {
      await message.delete();

      await message.author.send({
        embeds: [
          new EmbedBuilder()
            .setColor(mConfig.embedColorError)
            .setTitle("Message removed")
            .setDescription(
              `Your message on the **${message.guild.name}** server was deleted for using excessive capital letters.`
            )
            .addFields({ name: "Message", value: message.content })
            .setTimestamp(),
        ],
      });

      if (autoModData && autoModData.channelId) {
        const logChannel = message.guild.channels.cache.get(
          autoModData.channelId
        );

        const logEmbed = new EmbedBuilder()
          .setColor(mConfig.embedColorError)
          .setTitle("Excessive Caps Detected")
          .addFields(
            {
              name: "User",
              value: `<@${message.author.id}> (${message.author.id})`,
            },
            { name: "Message", value: message.content }
          )
          .setTimestamp();

        logChannel.send({ embeds: [logEmbed] });
      }
    }
  },
};
