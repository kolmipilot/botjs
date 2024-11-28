const { SlashCommandBuilder } = require('discord.js'); // Dodajemy import

module.exports = {
  data: new SlashCommandBuilder()
    .setName('set event-channel')
    .setDescription('Set channel where events will be posted')
    .addChannelOption(option => option.setName('channel').setDescription('Chennel where events threads will be posted.').setRequired(true)),

  async execute(interaction) {
    const channel = interaction.options.getChannel('channel');
    // Zapisz kanał do bota (przechowywanie w pamięci bota)
    interaction.client.eventChannelId = channel.id;

    interaction.reply({
      content: `The event channel has been set to: ${channel.name}`,
      ephemeral: true,
    });
  },
};
