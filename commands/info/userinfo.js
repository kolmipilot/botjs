const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const mConfig = require("../../messageConfig.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Displays information about a user')
    .addUserOption(option => 
      option.setName('target')
        .setDescription('Select a user to view their info')
        .setRequired(false)),
  
  async execute(client, interaction) {
    const user = interaction.options.getUser('target') || interaction.user;
    const member = interaction.guild.members.cache.get(user.id);

    const embed = new EmbedBuilder()
      .setColor(mConfig.embedColorPrimary) // Kolor embeda
      .setTitle(`${user.username}'s Information`) // Nazwa użytkownika w tytule
      .setThumbnail(user.displayAvatarURL()) // Avatar użytkownika
      .addFields(
        { name: 'Username', value: `${user.tag}`, inline: true },
        { name: 'ID', value: `${user.id}`, inline: true },
        { name: 'Joined Server', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:D>`, inline: true }, // Data dołączenia do serwera
        { name: 'Account Created', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:D>`, inline: true }, // Data utworzenia konta
        { name: 'Roles', value: member.roles.cache.map(role => role).join(', ') || 'None', inline: false } // Lista ról
      )
      .setFooter({ text: `User ID: ${user.id}` }) // ID użytkownika w stopce
      .setTimestamp(); // Dodajemy timestamp do embeda

    await interaction.reply({ embeds: [embed] });
  },
};
