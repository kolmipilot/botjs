const { Events, EmbedBuilder } = require("discord.js");
const UserLevel = require("../models/userLevel");
const Guild = require("../models/guild");
const Leveling = require("../models/leveling");
const mConfig = require("../messageConfig.json");

const xpIntervals = new Map();

module.exports = {
  name: Events.VoiceStateUpdate,
  async execute(client, oldState, newState) {
    const member = newState.member;
    const userId = member.id;

    const guildData = await Guild.findOne({ guildId: newState.guild.id });
    const levelingData = await Leveling.findOne({ guildId: newState.guild.id });

    if (newState.channelId && !oldState.channelId) {
      if (guildData && guildData.logChannelId) {
        const logChannel = newState.guild.channels.cache.get(
          guildData.logChannelId
        );

        if (logChannel) {
          const joinEmbed = new EmbedBuilder()
            .setColor(mConfig.embedColorSuccess)
            .setAuthor({
              name: `${member.user.tag}`,
              iconURL: member.displayAvatarURL(),
            })
            .setDescription("User joined voice channel")
            .setTitle("Voice state update")
            .addFields(
              {
                name: "User",
                value: `<@${userId}> (${userId})`,
              },
              {
                name: "Channel",
                value: `${newState.channel}`,
              }
            );
          logChannel.send({ embeds: [joinEmbed] });
        }
      }

      // Start an interval to give XP every minute
      if (!guildData.enabledSystems.level) return;

      const xpInterval = setInterval(async () => {
        const userLevelData =
          (await UserLevel.findOne({
            userId: userId,
            guildId: newState.guild.id,
          })) || new UserLevel({ userId: userId, guildId: newState.guild.id });

        const XP_PER_MINUTE = 10;
        userLevelData.exp += XP_PER_MINUTE;

        // Check for leveling up
        const requiredXp = userLevelData.level * 100;
        if (userLevelData.exp >= requiredXp) {
          userLevelData.level += 1;
          userLevelData.exp -= requiredXp;

          userLevelData.nextLevelExp = (userLevelData.level + 1) * 100;

          const levelChannel = newState.guild.channels.cache.get(
            levelingData?.channelId
          );

          const embed = new EmbedBuilder()
            .setColor(mConfig.embedColorSuccess)
            .setTitle("Level Up!")
            .setDescription(
              `**Congratulations!** ${member} leveled up to level **${userLevelData.level}**!`
            )
            .addFields({
              name: "Next Level EXP",
              value: `You now need **${
                (userLevelData.level + 1) * 100
              }** EXP for the next level!`,
            })
            .setTimestamp();
          levelChannel.send({ embeds: [embed] });
        }

        await userLevelData.save();
      }, 60000);

      // Store the interval for this user
      xpIntervals.set(userId, xpInterval);
    }

    if (!newState.channelId && oldState.channelId) {
      if (guildData && guildData.logChannelId) {
        const logChannel = newState.guild.channels.cache.get(
          guildData.logChannelId
        );

        if (logChannel) {
          const joinEmbed = new EmbedBuilder()
            .setColor(mConfig.embedColorError)
            .setAuthor({
              name: `${member.user.tag}`,
              iconURL: member.displayAvatarURL(),
            })
            .setDescription("User left voice channel")
            .setTitle("Voice state update")
            .addFields(
              {
                name: "User",
                value: `<@${userId}> (${userId})`,
              },
              {
                name: "Channel",
                value: `${oldState.channel}`,
              }
            );
          logChannel.send({ embeds: [joinEmbed] });
        }
      }

      if (!guildData.enabledSystems.level) return;

      const interval = xpIntervals.get(userId);

      // Clear the interval for this user
      if (interval) {
        clearInterval(interval);
        xpIntervals.delete(userId);
      }
    }

    if (
      newState.channelId &&
      oldState.channelId &&
      newState.channelId !== oldState.channelId
    ) {
      if (guildData && guildData.logChannelId) {
        const logChannel = newState.guild.channels.cache.get(
          guildData.logChannelId
        );

        if (logChannel) {
          const joinEmbed = new EmbedBuilder()
            .setColor(mConfig.embedColorWarning)
            .setAuthor({
              name: `${member.user.tag}`,
              iconURL: member.displayAvatarURL(),
            })
            .setDescription("User moved to another voice channel")
            .setTitle("Voice state update")
            .addFields(
              {
                name: "User",
                value: `<@${userId}> (${userId})`,
              },
              {
                name: "Before Channel",
                value: `${oldState.channel}`,
              },
              {
                name: "After Channel",
                value: `${newState.channel}`,
              }
            );
          logChannel.send({ embeds: [joinEmbed] });
        }
      }
    }
  },
};
