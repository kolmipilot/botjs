const { Events, EmbedBuilder, AuditLogEvent } = require("discord.js");
const Guild = require("../models/guild");
const mConfig = require("../messageConfig.json");

const muteLogMap = new Map();

module.exports = {
  name: Events.GuildMemberUpdate,
  async execute(client, oldMember, newMember) {
    const guild = newMember.guild;

    const oldMuteTimestamp = oldMember.communicationDisabledUntilTimestamp;
    const newMuteTimestamp = newMember.communicationDisabledUntilTimestamp;

    if (oldMuteTimestamp === newMuteTimestamp) return;

    const guildConfig = await Guild.findOne({ guildId: guild.id });
    if (!guildConfig) return;

    const logChannel = guild.channels.cache.get(guildConfig.logChannelId);
    if (!logChannel) return;

    const userId = newMember.id;
    const isMuted = newMuteTimestamp !== null;

    const fetchedLogs = await guild.fetchAuditLogs({
      limit: 1,
      type: AuditLogEvent.MemberUpdate,
    });

    const muteLog = fetchedLogs.entries.first();
    const executor = muteLog ? muteLog.executor : null;

    if (isMuted) {
      if (muteLogMap.get(userId) === true) return;
      muteLogMap.set(userId, true);

      const muteEmbed = new EmbedBuilder()
        .setColor(mConfig.embedColorError)
        .setAuthor({
          name: newMember.user.tag,
          iconURL: newMember.user.displayAvatarURL(),
        })
        .setThumbnail(newMember.user.displayAvatarURL())
        .setTitle("Member Muted")
        .addFields(
          {
            name: "Reason",
            value: "No reason provided",
          },
          {
            name: "User",
            value: `<@${newMember.id}> (${newMember.id})`,
          },
          {
            name: "Moderator",
            value: executor ? `<@${executor.id}>` : "Unknown",
          },
          {
            name: "Duration",
            value: newMuteTimestamp
              ? `<t:${Math.floor(newMuteTimestamp / 1000)}:R>`
              : "Indefinite",
          }
        )
        .setTimestamp();
      await logChannel.send({ embeds: [muteEmbed] });
    } else {
      if (muteLogMap.get(userId) === false) return;
      muteLogMap.set(userId, false);

      const unmuteEmbed = new EmbedBuilder()
        .setColor(mConfig.embedColorSuccess)
        .setAuthor({
          name: newMember.user.tag,
          iconURL: newMember.user.displayAvatarURL(),
        })
        .setThumbnail(newMember.user.displayAvatarURL())
        .setTitle("Member Unmuted")
        .addFields(
          {
            name: "User",
            value: `<@${newMember.id}> (${newMember.id})`,
          },
          {
            name: "Moderator",
            value: executor ? `<@${executor.id}>` : "Unknown",
          }
        )
        .setTimestamp();
      await logChannel.send({ embeds: [unmuteEmbed] });
    }
  },
};
