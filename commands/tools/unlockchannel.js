const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unlockchannel')
    .setDescription('Unlocks a channel, allowing everyone to send messages again')
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('The channel to unlock')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  
  async execute(client, interaction) {
    const channel = interaction.options.getChannel('channel');

    await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: true });
    await interaction.reply({
      content: `Unlocked ${channel} for everyone`,
      ephemeral: true
    });
  }
};
