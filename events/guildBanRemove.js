const { Events, AuditLogEvent, EmbedBuilder } = require("discord.js");
const Guild = require("../models/guild");
const mConfig = require("../messageConfig.json");

module.exports = {
  name: Events.GuildBanRemove,
  async execute(client, ban) {
    const guildConfig = await Guild.findOne({ guildId: ban.guild.id });
    const fetchedLogs = await ban.guild.fetchAuditLogs({
      limit: 1,
      type: AuditLogEvent.MemberBanRemove,
    });

    const unbanLog = fetchedLogs.entries.first();
    if (!unbanLog) return;

    const { executor, target } = unbanLog;

    if (target.id === ban.user.id && guildConfig) {
      const logChannel = ban.guild.channels.cache.get(guildConfig.logChannelId);
      if (logChannel) {
        const leaveEmbed = new EmbedBuilder()
          .setColor(mConfig.embedColorWarning)
          .setAuthor({
            name: ban.user.tag,
            iconURL: ban.user.displayAvatarURL(),
          })
          .setThumbnail(ban.user.displayAvatarURL())
          .setTitle("Member unbanned")
          .addFields(
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
