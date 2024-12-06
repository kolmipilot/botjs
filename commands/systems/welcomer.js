const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  PermissionFlagsBits,
} = require("discord.js");
const Welcomer = require("../../models/welcomer");
const mConfig = require("../../messageConfig.json");
const Guild = require("../../models/guild");

const joinWelcomerButton = require("../../components/buttons/joinWelcomerButton");
const leaveWelcomerButton = require("../../components/buttons/leaveWelcomerButton");
const cancelButton = require("../../components/buttons/cancelButton");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("welcomer")
    .setDescription("Setup welcome and leave notifications on your server")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("set")
        .setDescription("Setup welcomer system")
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("messages and notifications channel")
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("toggle")
        .setDescription("Enable or disable the entire Welcomer system")
        .addBooleanOption((option) =>
          option
            .setName("enabled")
            .setDescription("Enable or disable the Welcomer system")
            .setRequired(true)
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(client, interaction) {
    const guildId = interaction.guild.id;
    const subcommand = interaction.options.getSubcommand();

    const channel = interaction.options.getChannel("channel");

    const enabled = interaction.options.getBoolean("enabled");

    let guildData = await Guild.findOne({ guildId: interaction.guild.id });

    if (subcommand !== "toggle" && !guildData.enabledSystems.welcomer) {
      return interaction.reply({
        content: "This system is disabled! Use `/welcomer toggle enabled:`",
        ephemeral: true,
      });
    }

    if (subcommand === "set") {
      if (channel) {
        let welcomerConfig = await Welcomer.findOne({ guildId });

        if (!welcomerConfig) {
          welcomerConfig = new Welcomer({
            guildId,
            welcomerChannelId: channel.id,
          });
        }

        welcomerConfig.welcomerChannelId = channel.id;
        await welcomerConfig.save();

        return interaction.reply({
          content: `Welcomer channel has been set to <#${channel.id}>`,
          ephemeral: true,
        });
      }
      const setupEmbed = new EmbedBuilder()
        .setTitle("Welcomer System")
        .setDescription("Choose an action to setup a new messages")
        .setColor(mConfig.embedColorPrimary);

      const join = joinWelcomerButton.createButton();
      const leave = leaveWelcomerButton.createButton();
      const cancel = cancelButton.createButton();

      const row = new ActionRowBuilder().addComponents(join, leave, cancel);
      await interaction.reply({ embeds: [setupEmbed], components: [row] });
    } else if (subcommand === "toggle") {
      guildData.enabledSystems.welcomer = enabled;
      await guildData.save();

      return interaction.reply({
        content: `The Welcomer system has been ${
          enabled ? "enabled" : "disabled"
        }`,
        ephemeral: true,
      });
    }
  },
};
