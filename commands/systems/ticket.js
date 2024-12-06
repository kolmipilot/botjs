const {
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  PermissionsBitField,
  PermissionFlagsBits,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");
const TicketPanel = require("../../models/ticketPanel");
const mConfig = require("../../messageConfig.json");
const Guild = require("../../models/guild");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Manage ticket panels")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("create")
        .setDescription("Create a ticket panel")
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
            .setName("descripton")
            .setDescription("The description of the panel")
        )
        .addRoleOption((option) =>
          option.setName("adminrole").setDescription("The admin of ticket role")
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("addtopic")
        .setDescription("Add a topic to the ticket panel")
        .addStringOption((option) =>
          option
            .setName("panelid")
            .setDescription("The panel ID")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("label")
            .setDescription("The label for the topic")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("description")
            .setDescription("The description of the topic")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("removetopic")
        .setDescription("Remove a topic from the ticket panel")
        .addStringOption((option) =>
          option
            .setName("panelid")
            .setDescription("The panel ID")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("label")
            .setDescription("The label of the topic you wand to remove")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("edit")
        .setDescription("Edit a ticket panel")
        .addStringOption((option) =>
          option
            .setName("panelid")
            .setDescription("The panel ID")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option.setName("title").setDescription("The title of the panel")
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("send")
        .setDescription("Send a ticket panel")
        .addStringOption((option) =>
          option
            .setName("panelid")
            .setDescription("The panel ID")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("delete")
        .setDescription("Delete a ticket panel")
        .addStringOption((option) =>
          option
            .setName("panelid")
            .setDescription("The panel ID")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("toggle")
        .setDescription("Enable or disable the entire Ticket system")
        .addBooleanOption((option) =>
          option
            .setName("enabled")
            .setDescription("Enable or disable the Ticket system")
            .setRequired(true)
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(client, interaction) {
    const subcommand = interaction.options.getSubcommand();

    const panelId = interaction.options.getString("panelid");

    const title = interaction.options.getString("title") || "Ticket Panel";
    const adminRole = interaction.options.getRole("adminrole");

    const label = interaction.options.getString("label");
    const description = interaction.options.getString("description");

    const enabled = interaction.options.getBoolean("enabled");

    let guildData =
      (await Guild.findOne({ guildId: interaction.guild.id })) ||
      new Guild({ guildId: interaction.guild.id });

    if (subcommand !== "toggle" && !guildData.enabledSystems.ticket) {
      return interaction.reply(
        "This system is disabled! Use `/ticket toggle enabled:`"
      );
    }

    const panel = await TicketPanel.findOne({
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

      const newPanel = new TicketPanel({
        panelId,
        guildId: interaction.guild.id,
        title,
        description,
        topics: [],
        adminRoleId: adminRole.id,
      });

      await newPanel.save();
      await interaction.reply(`Ticket panel \`${panelId}\` created!`);
    } else if (subcommand === "addtopic") {
      const topicExists = panel.topics.some((topic) => topic.label === label);

      if (topicExists) {
        return interaction.reply({
          content: `Topic ${label} has been already added to panel \`${panelId}\``,
          ephemeral: true,
        });
      }

      panel.topics.push({ label, description });
      await panel.save();

      await interaction.reply(
        `Topic **${label}** added to panel \`${panelId}\``
      );
    } else if (subcommand === "removetopic") {
      const topicIndex = panel.topics.findIndex(
        (topic) => topic.label === label
      );
      if (topicIndex === -1) {
        return interaction.reply("Topic not found in this panel");
      }

      panel.topics.splice(topicIndex, 1);
      await panel.save();

      await interaction.reply(
        `Topic **${label}** removed from panel \`${panelId}\``
      );
    } else if (subcommand === "send") {
      const row = new ActionRowBuilder();
      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(`select-ticket-topic_${panelId}`)
        .setPlaceholder("Select a ticket topic");

      panel.topics.forEach((topic) => {
        selectMenu.addOptions({
          label: topic.label,
          description: topic.description,
          value: topic.label.toLowerCase(),
        });
      });

      row.addComponents(selectMenu);

      const embed = new EmbedBuilder()
        .setColor(mConfig.embedColorPrimary)
        .setTitle(panel.title)
        .setDescription(panel.description)
        .setFooter({ text: `Powered By ${client.user.tag}` });

      await interaction.reply({
        embeds: [embed],
        components: [row],
      });
    } else if (subcommand === "edit") {
      if (adminRole) {
        panel.adminRoleId = adminRole.id;
        await panel.save();
      }

      const modal = new ModalBuilder()
        .setCustomId(`edit-ticket-panel_${panelId}`)
        .setTitle("Edit Ticket Panel");

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
    } else if (subcommand === "toggle") {
      guildData.enabledSystems.ticket = enabled;
      await guildData.save();

      return interaction.reply(
        `The Ticket system has been ${enabled ? "enabled" : "disabled"}`
      );
    }
  },
};
