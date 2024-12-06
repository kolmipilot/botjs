const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const mConfig = require("../../messageConfig.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName('channelinfo')
    .setDescription('Displays information about the current channel'),

  async execute(client, interaction) {
    const channel = interaction.channel;

    const embed = new EmbedBuilder()
      .setColor(mConfig.embedColorPrimary)
      .setTitle(`${channel.name} Information`)
      .addFields(
        { name: 'Channel ID', value: `${channel.id}`, inline: true },
        { name: 'Channel Type', value: `${channel.type}`, inline: true },
        { name: 'Created At', value: `<t:${Math.floor(channel.createdTimestamp / 1000)}:D>`, inline: true },
        { name: 'Position', value: `${channel.position}`, inline: true }
      )
      .setFooter({ text: `Requested by ${interaction.user.tag}` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
