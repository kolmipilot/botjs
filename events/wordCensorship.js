const { Events, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const AutoMod = require("../models/automod");
const mConfig = require("../messageConfig.json");

module.exports = {
  name: Events.MessageCreate,
  async execute(client, message) {
    const autoModData = await AutoMod.findOne({ guildId: message.guild.id });
    if (!autoModData || !autoModData.enabledFeatures.wordCensorship) return;

    if (
      message.author.bot ||
      message.member.permissions.has(PermissionFlagsBits.Administrator)
    )
      return;

    const bannedWords = autoModData.bannedWords;

    const lowerMessage = message.content.toLowerCase();
    const containsBannedWord = bannedWords.some((word) =>
      lowerMessage.includes(word)
    );

    if (containsBannedWord) {
      await message.delete();

      await message.author.send({
        embeds: [
          new EmbedBuilder()
            .setColor(mConfig.embedColorError)
            .setTitle("Message removed")
            .setDescription(
              `Your message on the **${message.guild.name}** server was deleted for using inappropriate language`
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
          .setTitle("Inappropriate Language Used")
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
