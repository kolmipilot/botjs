const { Events, AuditLogEvent, EmbedBuilder } = require("discord.js");
const Guild = require("../models/guild");
const mConfig = require("../messageConfig.json");

module.exports = {
  name: Events.GuildBanAdd,
  async execute(client, interaction) {
    const { user, guild } = interaction;
    const guildConfig = await Guild.findOne({ guildId: guild.id });

    if (!guildConfig) return;

    const fetchedLogs = await guild.fetchAuditLogs({
      limit: 1,
      type: AuditLogEvent.MemberBanAdd,
    });

    const banLog = fetchedLogs.entries.first();

    if (!banLog) return;

    const { executor, target, reason } = banLog;

    if (target.id === user.id) {
      const logChannel = guild.channels.cache.get(guildConfig.logChannelId);
      if (logChannel) {
        const leaveEmbed = new EmbedBuilder()
          .setColor(mConfig.embedColorError)
          .setAuthor({
            name: target.tag,
            iconURL: target.displayAvatarURL(),
          })
          .setThumbnail(target.displayAvatarURL())
          .setTitle("Member banned")
          .addFields(
            {
              name: "Reason",
              value: reason,
            },
            {
              name: "Moderator",
              value: `<@${executor.id}>`,
            },
            {
              name: "User",
              value: `<@${target.id}> (${target.id})`,
            }
          );
        logChannel.send({ embeds: [leaveEmbed] });
      }
    }
  },
};
