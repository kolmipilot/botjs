const { Events, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const AutoMod = require("../models/automod");
const mConfig = require("../messageConfig.json");

module.exports = {
  name: Events.MessageCreate,
  async execute(client, message) {
    const autoModData = await AutoMod.findOne({ guildId: message.guild.id });
    if (!autoModData || !autoModData.enabledFeatures.emojiManager) return;

    if (
      message.author.bot ||
      message.member.permissions.has(PermissionFlagsBits.Administrator)
    )
      return;

    const emojiLimit = autoModData.emojiLimit;

    const emojiRegex = /<a?:\w+:\d+>/g;
    const emojiCount = (message.content.match(emojiRegex) || []).length;

    if (emojiCount > emojiLimit) {
      await message.delete();

      await message.author.send({
        embeds: [
          new EmbedBuilder()
            .setColor(mConfig.embedColorError)
            .setTitle("Message removed")
            .setDescription(
              `Your message on the **${message.guild.name}** server was deleted because it contained too many emojis (limit is ${emojiLimit})`
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
          .setTitle("Too Many Emojis Used")
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
