const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lockchannel')
    .setDescription('Locks a channel, preventing everyone from sending messages')
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('The channel to lock')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  
  async execute(client, interaction) {
    const channel = interaction.options.getChannel('channel');

    await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false });
    await interaction.reply({
      content: `Locked ${channel} for everyone`,
      ephemeral: true
    });
  }
};
