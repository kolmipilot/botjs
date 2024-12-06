const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  TextInputStyle,
  TextInputBuilder,
  ModalBuilder,
} = require("discord.js");
const mConfig = require("../../messageConfig.json");
const RolePanel = require("../../models/rolePanel");
const Guild = require("../../models/guild");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("selfrole")
    .setDescription("Manage selfrole panels")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("create")
        .setDescription("Create a selfrole panel")
        .addStringOption((option) =>
          option
            .setName("panelid")
            .setDescription("The ID for the panel")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option.setName("title").setDescription("The title of the panel")
        )
        .addStringOption((option) =>
          option
            .setName("description")
            .setDescription("The description of the panel")
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("addrole")
        .setDescription("Add a role to a selfrole panel")
        .addStringOption((option) =>
          option
            .setName("panelid")
            .setDescription("The panel ID")
            .setRequired(true)
        )
        .addRoleOption((option) =>
          option
            .setName("role")
            .setDescription("The role to add")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("label")
            .setDescription("The label for the button")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("style")
            .setDescription("The button style")
            .setRequired(true)
            .addChoices(
              { name: "Primary", value: "Primary" },
              { name: "Secondary", value: "Secondary" },
              { name: "Success", value: "Success" },
              { name: "Danger", value: "Danger" }
            )
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("removerole")
        .setDescription("Remove a role from a selfrole panel")
        .addStringOption((option) =>
          option
            .setName("panelid")
            .setDescription("The panel ID")
            .setRequired(true)
        )
        .addRoleOption((option) =>
          option
            .setName("role")
            .setDescription("The role to remove")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("send")
        .setDescription("Send a selfrole panel")
        .addStringOption((option) =>
          option
            .setName("panelid")
            .setDescription("The panel ID")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("edit")
        .setDescription("Edit a selfrole panel")
        .addStringOption((option) =>
          option
            .setName("panelid")
            .setDescription("The ID for the panel")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("toggle")
        .setDescription("Enable or disable the entire Selfrole system")
        .addBooleanOption((option) =>
          option
            .setName("enabled")
            .setDescription("Enable or disable the Selfrole system")
            .setRequired(true)
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(client, interaction) {
    const subcommand = interaction.options.getSubcommand();

    const panelId = interaction.options.getString("panelid");
    const guildId = interaction.guild.id;

    const role = interaction.options.getRole("role");
    const label = interaction.options.getString("label");
    const style = interaction.options.getString("style").toUpperCase();

    const title = interaction.options.getString("title") || "Selfrole Panel";
    const description =
      interaction.options.getString("description") ||
      "Click the buttons to assign roles";

    const enabled = interaction.options.getBoolean("enabled");

    let guildData =
      (await Guild.findOne({ guildId })) || new Guild({ guildId });

    if (subcommand !== "toggle" && !guildData.enabledSystems.selfrole) {
      return interaction.reply(
        "This system is disabled! Use `/selfrole toggle enabled:`"
      );
    }

    const panel = await RolePanel.findOne({
      panelId,
      guildId: interaction.guild.id,
    });
    if (subcommand !== "create" && !panel) {
      return interaction.reply("Panel not found");
    }

    if (subcommand === "create") {
      if (panel) {
        return interaction.reply(`Panel with id \`${panelId}\` already exist`);
      }

      const newPanel = new RolePanel({
        panelId,
        guildId,
        title,
        description,
        roles: [],
      });

      await newPanel.save();
      await interaction.reply({
        content: `Selfrole panel with ID \`${panelId}\` created! Use \`/selfrole addrole\` to add roles`,
        ephemeral: true,
      });
    } else if (subcommand === "edit") {
      const modal = new ModalBuilder()
        .setCustomId(`edit-panel_${panelId}`)
        .setTitle("Edit Selfrole Panel");

      const titleInput = new TextInputBuilder()
        .setCustomId("title")
        .setLabel("Panel Title")
        .setStyle(TextInputStyle.Short)
        .setRequired(false);

      const descriptionInput = new TextInputBuilder()
        .setCustomId("description")
        .setLabel("Panel Description")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false);

      modal.addComponents(
        new ActionRowBuilder().addComponents(titleInput),
        new ActionRowBuilder().addComponents(descriptionInput)
      );

      await interaction.showModal(modal);
    } else if (subcommand === "addrole") {
      const roleExists = panel.roles.some((role) => role.roleId === role.id);

      if (roleExists) {
        return interaction.reply({
          content: `Role ${role} has been already added to panel \`${panelId}\``,
          ephemeral: true,
        });
      }

      panel.roles.push({
        label,
        roleId: role.id,
        buttonStyle: ButtonStyle[style] || ButtonStyle.Primary,
      });

      await panel.save();
      return interaction.reply({
        content: `Role <@${role.id}> added to panel \`${panelId}\` with label **${label}**`,
        ephemeral: true,
      });
    } else if (subcommand === "removerole") {
      const roleIndex = panel.roles.findIndex((r) => r.roleId === role.id);
      if (roleIndex === -1) {
        return interaction.reply("Role not found in this panel");
      }

      panel.roles.splice(roleIndex, 1);
      await panel.save();

      await interaction.reply({
        content: `Role ${role} removed from panel \`${panelId}\``,
        ephemeral: true,
      });
    } else if (subcommand === "send") {
      const row = new ActionRowBuilder();
      panel.roles.forEach((roleData) => {
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`selfrole_${roleData.roleId}`)
            .setLabel(roleData.label)
            .setStyle(roleData.buttonStyle)
        );
      });

      const embed = new EmbedBuilder()
        .setTitle(panel.title)
        .setDescription(panel.description)
        .setColor(mConfig.embedColorPrimary);

      await interaction.reply({
        embeds: [embed],
        components: [row],
      });
    } else if (subcommand === "toggle") {
      guildData.enabledSystems.selfrole = enabled;
      await guildData.save();

      return interaction.reply(
        `The Selfrole system has been ${enabled ? "enabled" : "disabled"}`
      );
    }
  },
};
