const {
  Events,
  EmbedBuilder,
  PermissionsBitField,
  PermissionFlagsBits,
} = require("discord.js");
const AutoMod = require("../models/automod");
const mConfig = require("../messageConfig.json");

const TIMEOUT_DURATION = 60000;

module.exports = {
  name: Events.MessageCreate,
  async execute(client, message) {
    const autoModData = await AutoMod.findOne({ guildId: message.guild.id });
    if (!autoModData || !autoModData.enabledFeatures.linkRemover) return;

    if (
      message.author.bot ||
      message.member.permissions.has(PermissionFlagsBits.Administrator)
    )
      return;

    const linkRegex = /(https?:\/\/[^\s]+)/g;

    if (linkRegex.test(message.content)) {
      const foundLinks = message.content.match(linkRegex);

      let isAllowed = foundLinks.some((link) =>
        autoModData.domains.some((domain) => link.includes(domain))
      );

      if (!isAllowed) {
        await message.member.timeout(TIMEOUT_DURATION);

        await message.delete().catch((e) => {
          console.log(`Nie udało się usunąć wiadomości: ${e}`);
          return;
        });

        await message.author.send({
          embeds: [
            new EmbedBuilder()
              .setColor(mConfig.embedColorError)
              .setTitle("You have been muted")
              .setDescription(
                `You were muted on the **${message.guild.name}** server for unauthorized link.`
              )
              .addFields({ name: "Message", value: message.content })
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
              .setTitle("Unauthorized link")
              .addFields(
                {
                  name: "User",
                  value: `<@${message.author.id}> (${message.author.id})`,
                },
                { name: "Message", value: message.content },
                { name: "Channel", value: `<#${message.channel.id}>` },
                { name: "Action", value: "1 minute mute applied" }
              )
              .setTimestamp();

            await logChannel.send({ embeds: [logEmbed] }).catch((err) => {
              console.error(`Nie udało się wysłać logów: ${err}`);
            });
          }
        }
      }
    }
  },
};
