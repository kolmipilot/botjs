const { SlashCommandBuilder, PermissionFlagsBits} = require('discord.js');
const Events = require('../../models/events');
const Guild = require("../../models/guild");

module.exports = {
  data: new SlashCommandBuilder()
    .setName('events')
    .setDescription('Manage event settings for the server')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('set')
        .setDescription('Set the channel where events will be posted')
        .addChannelOption(option =>
          option
            .setName('channel')
            .setDescription('Channel where events threads will be posted')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('toggle')
        .setDescription('Enable or disable the event system')
        .addBooleanOption(option =>
          option
            .setName('enabled')
            .setDescription('Enable or disable the event system')
            .setRequired(true)
        )
    ),
    

  async execute(client, interaction) {
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;
    let guildData = await Guild.findOne({ guildId: interaction.guild.id });

    try {
      let eventConfig = await Events.findOne({ guildId });

      if (!eventConfig) {
        // Jeśli konfiguracja dla gildii nie istnieje, utwórz nowy wpis
        eventConfig = new Events({ guildId });
      }

      if (subcommand === 'set') {
        const channel = interaction.options.getChannel('channel');
        eventConfig.eventChannelId = channel.id; // Ustawienie kanału wydarzeń
        await eventConfig.save();

        return interaction.reply({
          content: `The event channel has been set to <#${channel.id}>.`,
          ephemeral: true,
        });
      }

      if (subcommand === 'toggle') {
        const enabled = interaction.options.getBoolean('enabled');
        if (enabled) {
          if (!eventConfig.eventChannelId) {
            return interaction.reply({
              content:
                'Please set an event channel first using `/events set` before enabling the system.',
              ephemeral: true,
            });
          }
        }

        guildData.enabledSystems.events = enabled; // Włączenie/wyłączenie systemu
        await guildData.save();

        return interaction.reply({
          content: `The event system has been ${enabled ? 'enabled' : 'disabled'}.`,
          ephemeral: true,
        });
      }
    } catch (error) {
      console.error('Error handling event command:', error);
      await interaction.reply({
        content: 'An error occurred while processing the event command.',
        ephemeral: true,
      });
    }
  },
};
