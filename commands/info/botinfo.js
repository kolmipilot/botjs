const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const mConfig = require("../../messageConfig.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName('botinfo')
    .setDescription('Displays information about the bot'),

  async execute(client, interaction) {
    const embed = new EmbedBuilder()
      .setColor(mConfig.embedColorPrimary)
      .setTitle(`${client.user.tag} Information`)
      .addFields(
        { name: 'Bot ID', value: client.user.id, inline: true },
        { name: 'Total Servers', value: `${client.guilds.cache.size}`, inline: true },
        { name: 'Uptime', value: `${Math.floor(client.uptime / 1000)} seconds`, inline: true },
        { name: 'Created At', value: `<t:${Math.floor(client.user.createdTimestamp / 1000)}:D>`, inline: true }
      )
      .setFooter({ text: `Requested by ${interaction.user.tag}` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
