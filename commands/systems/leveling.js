const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} = require("discord.js");
const Leveling = require("../../models/leveling");
const Guild = require("../../models/guild");
const mConfig = require("../../messageConfig.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("leveling")
    .setDescription("Setup leveling on your server")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("set")
        .setDescription("Setup new leveling system!")
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("Leveling notifications channel")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("toggle")
        .setDescription("Enable or disable the entire leveling system")
        .addBooleanOption((option) =>
          option
            .setName("enabled")
            .setDescription("Enable or disable the leveling system")
            .setRequired(true)
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(client, interaction) {
    const guildId = interaction.guild.id;
    const subcommand = interaction.options.getSubcommand();

    const channel = interaction.options.getChannel("channel");
    const enabled = interaction.options.getBoolean("enabled");

    let guildData =
      (await Guild.findOne({ guildId })) || new Guild({ guildId });

    if (subcommand !== "toggle" && !guildData.enabledSystems.level) {
      return interaction.reply({
        content: "This system is disabled! Use `/leveling toggle enabled:`",
        ephemeral: true,
      });
    }

    if (subcommand === "set") {
      let guildConfig = await Leveling.findOne({ guildId });

      if (!guildConfig) {
        guildConfig = new Leveling({
          guildId,
          channelId: channel.id,
        });
        await guildConfig.save();
      } else {
        guildConfig.channelId = channel.id;
        await guildConfig.save();
      }

      await interaction.reply({
        content: `Leveling channel has been set to <#${channel.id}>`,
        ephemeral: true,
      });
    } else if (subcommand === "toggle") {
      guildData.enabledSystems.level = enabled;
      await guildData.save();

      return interaction.reply({
        content: `The leveling system has been ${
          enabled ? "enabled" : "disabled"
        }`,
        ephemeral: true,
      });
    }
  },
};
