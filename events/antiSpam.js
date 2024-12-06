const { Events, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const AutoMod = require("../models/automod");
const mConfig = require("../messageConfig.json");

const spamMap = new Map();
const SPAM_LIMIT = 5; // Maksymalna ilość wiadomości
const TIME_WINDOW = 3000; // Okno czasowe w ms (np. 3 sekundy)
const TIMEOUT_DURATION = 60000; // Czas timeoutu w ms (1 minuta)

module.exports = {
  name: Events.MessageCreate,
  async execute(client, message) {
    const autoModData = await AutoMod.findOne({ guildId: message.guild.id });
    if (!autoModData || !autoModData.enabledFeatures.antiSpam) return;

    if (
      message.author.bot ||
      message.member.permissions.has(PermissionFlagsBits.Administrator)
    )
      return;

    const userId = message.author.id;
    const now = Date.now();

    if (!spamMap.has(userId)) {
      spamMap.set(userId, []);
    }

    const timestamps = spamMap.get(userId);
    timestamps.push(now);

    const recentMessages = timestamps.filter(
      (timestamp) => now - timestamp < TIME_WINDOW
    );

    spamMap.set(userId, recentMessages);

    if (recentMessages.length > SPAM_LIMIT) {
      await message.member.timeout(TIMEOUT_DURATION);

      await message.channel
        .bulkDelete(recentMessages.length, true)
        .catch(console.error);

      await message.author.send({
        embeds: [
          new EmbedBuilder()
            .setColor(mConfig.embedColorError)
            .setTitle("You have been muted")
            .setDescription(
              `You were muted on the **${message.guild.name}** server for spamming. Please slow down your messages.`
            )
            .setFooter({ text: "This mute lasts for 1 minute." })
            .setTimestamp(),
        ],
      });

      if (autoModData && autoModData.channelId) {
        const logChannel = message.guild.channels.cache.get(
          autoModData.channelId
        );

        if (logChannel) {
          const logEmbed = new EmbedBuilder()
            .setColor(mConfig.embedColorError)
            .setTitle("Spamming")
            .addFields(
              {
                name: "User",
                value: `<@${message.author.id}> (${message.author.id})`,
              },
              {
                name: "Messages Sent",
                value: `${recentMessages.length} messages within ${
                  TIME_WINDOW / 1000
                } seconds`,
              },
              { name: "Channel", value: `<#${message.channel.id}>` },
              { name: "Action", value: "1 minute mute applied" }
            )
            .setTimestamp();

          await logChannel.send({ embeds: [logEmbed] });
        }
      }
      spamMap.delete(userId);
    }
  },
};
