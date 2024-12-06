const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const mConfig = require("../../messageConfig.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName('roleinfo')
    .setDescription('Displays information about a role')
    .addRoleOption(option => 
      option.setName('role')
      .setDescription('The role to get information about')
    ),

  async execute(client, interaction) {
    const role = interaction.options.getRole('role') || interaction.member.roles.highest;

    const embed = new EmbedBuilder()
      .setColor(role.color)
      .setTitle(`${role.name} Information`)
      .addFields(
        { name: 'Role ID', value: role.id, inline: true },
        { name: 'Color', value: role.hexColor, inline: true },
        { name: 'Position', value: `${role.position}`, inline: true },
        { name: 'Members', value: `${role.members.size}`, inline: true },
        { name: 'Mentionable', value: role.mentionable ? 'Yes' : 'No', inline: true },
        { name: 'Hoisted', value: role.hoist ? 'Yes' : 'No', inline: true }
      )
      .setFooter({ text: `Requested by ${interaction.user.tag}` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
