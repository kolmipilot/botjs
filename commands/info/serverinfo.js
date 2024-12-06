const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const mConfig = require("../../messageConfig.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Displays information about the server'),
  
  async execute(client, interaction) {
    const { guild } = interaction;

    const embed = new EmbedBuilder()
      .setColor(mConfig.embedColorPrimary) // Kolor embeda
      .setTitle(`${guild.name} Information`)
      .setThumbnail(guild.iconURL()) // Ikona serwera
      .addFields(
        { name: 'Server Name', value: guild.name, inline: true },
        { name: 'Owner', value: `<@${guild.ownerId}>`, inline: true }, // Właściciel serwera
        { name: 'Member Count', value: `${guild.memberCount}`, inline: true }, // Liczba członków
        { name: 'Created At', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`, inline: true }, // Data utworzenia
        { name: 'Verification Level', value: `${guild.verificationLevel}`, inline: true }, // Poziom weryfikacji
        { name: 'Number of Roles', value: `${guild.roles.cache.size}`, inline: true }, // Liczba ról
        { name: 'Boost Tier', value: guild.premiumTier ? `Tier ${guild.premiumTier}` : 'No Boosts', inline: true }, // Poziom boosta
        { name: 'Boost Count', value: `${guild.premiumSubscriptionCount || '0'}`, inline: true } // Liczba boostów
      )
      .setFooter({ text: `Server ID: ${guild.id}` }) // ID serwera w stopce
      .setTimestamp(); // Dodajemy timestamp do embeda
      
    await interaction.reply({ embeds: [embed] });
  },
};
