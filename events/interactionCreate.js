const {
  Events,
  EmbedBuilder,
  ButtonStyle,
  ButtonBuilder,
  ActionRowBuilder,
  ChannelType,
  PermissionsBitField,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");
const fs = require("node:fs");
const path = require("node:path");
const config = require("../config.json");
const mConfig = require("../messageConfig.json");

const Guild = require("../models/guild");
const Welcomer = require("../models/welcomer");
const RolePanel = require("../models/rolePanel");
const TicketPanel = require("../models/ticketPanel");
const Giveaway = require("../models/giveaway");

const allowedGuilds = config.allowedGuilds;
const allowedChannels = config.allowedChannels;
const isDevMode = config.devMode === true;

module.exports = {
  name: Events.InteractionCreate,
  async execute(client, interaction) {
    if (isDevMode && !allowedGuilds.includes(interaction.guild.id)) {
      return interaction.reply({
        content: "This interaction can only be used on allowed servers.",
        ephemeral: true,
      });
    }

    /* if (isDevMode && !allowedChannels.includes(interaction.channel.id)) {
      return interaction.reply({
        content: "This interaction can only be used in specific channels.",
        ephemeral: true,
      });
    } */

    const { customId } = interaction;

    if (interaction.isCommand()) {
      const command = client.commands.get(interaction.commandName);

      if (!command) {
        return interaction.reply({
          content: `\`${interaction.commandName}\` is not a command!`,
          ephemeral: true,
        });
      }

      try {
        await command.execute(client, interaction);
      } catch (e) {
        console.log(e);
        await interaction.reply({
          content: "There was an error while executing this command!",
          ephemeral: true,
        });
      }
    } else if (interaction.isButton()) {
      if (customId.startsWith("selfrole")) {
        const roleId = interaction.customId.split("_")[1];
        const role = interaction.guild.roles.cache.get(roleId);

        if (role) {
          const member = interaction.guild.members.cache.get(
            interaction.user.id
          );
          if (member.roles.cache.has(roleId)) {
            await member.roles.remove(roleId);
            return interaction.reply({
              content: `Role <@${role.id}> removed!`,
              ephemeral: true,
            });
          } else {
            await member.roles.add(roleId);
            return interaction.reply({
              content: `Role <@${role.id}> added!`,
              ephemeral: true,
            });
          }
        }
      } else if (customId === "close_ticket") {
        const modal = new ModalBuilder()
          .setCustomId("close_ticket_modal")
          .setTitle("Close Ticket");

        const reasonInput = new TextInputBuilder()
          .setCustomId("close_ticket_reason")
          .setLabel("Reason for closing the ticket")
          .setStyle(TextInputStyle.Short)
          .setPlaceholder("Enter your reason")
          .setRequired(false);

        const row = new ActionRowBuilder().addComponents(reasonInput);
        modal.addComponents(row);

        await interaction.showModal(modal);
      } else if (interaction.customId.startsWith("giveaway-join")) {
        const giveawayId = interaction.customId.split("_")[1];
        const giveaway = await Giveaway.findOne({ giveawayId });

        if (!giveaway || !giveaway.isActive) {
          return interaction.reply({
            content: "This giveaway is no longer active.",
            ephemeral: true,
          });
        }

        if (giveaway.participants.includes(interaction.user.id)) {
          return interaction.reply({
            content: "You have already joined this giveaway!",
            ephemeral: true,
          });
        }

        giveaway.participants.push(interaction.user.id);
        await giveaway.save();

        return interaction.reply({
          content: "You have successfully joined the giveaway!",
          ephemeral: true,
        });
      } else {
        const button = client.buttons.get(customId);

        if (!button) {
          return await interaction.reply({
            content: "This button does not have an associated action.",
            ephemeral: true,
          });
        }

        await button.execute(interaction);
      }
    } else if (interaction.isModalSubmit()) {
      const guildConfig = await Guild.findOne({
        guildId: interaction.guild.id,
      });
      const welcomerConfig = await Welcomer.findOne({
        guildId: interaction.guild.id,
      });

      if (customId.startsWith("modal-ban-")) {
        const user = customId.split("-")[2];
        const cleanUserId = user.replace(/<@!?(\d+)>/, "$1");
        if (!/^\d{17,19}$/.test(cleanUserId)) {
          return await interaction.reply({
            content: "Invalid user ID provided.",
            ephemeral: true,
          });
        }

        const reason = interaction.fields.getTextInputValue("reasonInput");

        const guild = interaction.guild;
        const member = await guild.members.fetch(cleanUserId);
        await member.ban({ reason });

        await interaction.reply({
          content: `User <@${cleanUserId}> has been banned for: ${reason}`,
          ephemeral: true,
        });
      } else if (customId.startsWith("modal-kick-")) {
        const user = customId.split("-")[2];
        const cleanUserId = user.replace(/<@!?(\d+)>/, "$1");
        if (!/^\d{17,19}$/.test(cleanUserId)) {
          return await interaction.reply({
            content: "Invalid user ID provided.",
            ephemeral: true,
          });
        }

        const reason = interaction.fields.getTextInputValue("reasonInput");

        const guild = interaction.guild;
        const member = await guild.members.fetch(cleanUserId);
        await member.kick(reason);

        await interaction.reply({
          content: `User <@${cleanUserId}> has been kicked for: ${reason}`,
          ephemeral: true,
        });
      } else if (customId === "modal-leave-welcomer") {
        const message = interaction.fields.getTextInputValue("welcomerMessage");
        const title = interaction.fields.getTextInputValue("welcomerTitle");
        const footer = interaction.fields.getTextInputValue("welcomerFooter");

        const guildId = interaction.guild.id;

        let farewellData = await Welcomer.findOne({ guildId });
        if (!farewellData) {
          return interaction.reply({
            content:
              "Welcomer System has not found. Want to create a new Welcomer System Setup? Use `/welcomer create channel:`",
            ephemeral: true,
          });
        }

        farewellData.farewellMessage.title = title || "Goodbye!";
        farewellData.farewellMessage.body = message || "Sad to see you go.";
        farewellData.farewellMessage.footer =
          footer || "We hope to see you again.";

        await farewellData.save();

        const embed = new EmbedBuilder()
          .setTitle("Welcomer System")
          .setDescription("Sucessfully saved new leave messages")
          .setColor(mConfig.embedColorSuccess);

        await interaction.reply({ embeds: [embed] });
      } else if (customId === "modal-join-welcomer") {
        const message = interaction.fields.getTextInputValue("welcomerMessage");
        const title = interaction.fields.getTextInputValue("welcomerTitle");
        const footer = interaction.fields.getTextInputValue("welcomerFooter");

        const guildId = interaction.guild.id;

        let welcomeData = await Welcomer.findOne({ guildId });
        if (!welcomeData) {
          return interaction.reply({
            content:
              "Welcomer System has not found. Want to create a new Welcomer System Setup? Use `/welcomer create channel:`",
            ephemeral: true,
          });
        }

        welcomeData.welcomeMessage.title = title || "Welcome!";
        welcomeData.welcomeMessage.body =
          message || "Hello {user}, welcome to the server!";
        welcomeData.welcomeMessage.footer = footer || "Enjoy your stay!";

        await welcomeData.save();

        const embed = new EmbedBuilder()
          .setTitle("Welcomer System")
          .setDescription("Sucessfully saved new join messages")
          .setColor(mConfig.embedColorSuccess);

        await interaction.reply({ embeds: [embed] });
      } else if (customId.startsWith("edit-panel")) {
        const panelId = customId.split("_")[1];
        const panel = await RolePanel.findOne({
          panelId,
          guildId: interaction.guild.id,
        });

        if (!panel) {
          return interaction.reply({
            content: "Panel not found.",
            ephemeral: true,
          });
        }

        const newTitle =
          interaction.fields.getTextInputValue("title") || panel.title;
        const newDescription =
          interaction.fields.getTextInputValue("description") ||
          panel.description;

        panel.title = newTitle;
        panel.description = newDescription;
        await panel.save();

        await interaction.reply({
          content: `Panel \`${panelId}\` updated successfully!`,
          ephemeral: true,
        });
      } else if (customId.startsWith("edit-ticket-panel")) {
        const panelId = customId.split("_")[1];
        const panel = await TicketPanel.findOne({
          panelId,
          guildId: interaction.guild.id,
        });

        if (!panel) {
          return interaction.reply({
            content: "Panel not found",
            ephemeral: true,
          });
        }

        const newTitle =
          interaction.fields.getTextInputValue("title") || panel.title;
        const newDescription =
          interaction.fields.getTextInputValue("description") ||
          panel.description;

        panel.title = newTitle;
        panel.description = newDescription;
        await panel.save();

        await interaction.reply({
          content: `Panel \`${panelId}\` updated successfully!`,
          ephemeral: true,
        });
      } else if (customId === "close_ticket_modal") {
        const reason =
          interaction.fields.getTextInputValue("close_ticket_reason") ||
          "No reason privided";
        const ticketChannel = interaction.channel;
        const guild = await Guild.findOne({ guildId: interaction.guild.id });
        const user = interaction.guild.members.cache.find(
          (member) => member.user.username === ticketChannel.name.split("-")[1]
        );

        await interaction.reply({
          content: "Closing Ticket ...",
          aphemeral: true,
        });

        await ticketChannel.delete();

        if (guild.archiveChannelId) {
          const archiveChannel = interaction.guild.channels.cache.get(
            guild.archiveChannelId
          );

          const closeEmbed = new EmbedBuilder()
            .setColor(mConfig.embedColorError)
            .setTitle("Ticket Closed")
            .addFields(
              {
                name: "Opened by:",
                value: `${user}`,
              },
              {
                name: "Closed by:",
                value: `${interaction.user}`,
              },
              { name: "Reason:", value: `${reason}` }
            )
            .setTimestamp();

          await archiveChannel.send({ embeds: [closeEmbed] });
        }
      } else if (interaction.customId === "embed-modal") {
        const title = interaction.fields.getTextInputValue("embedTitle");
        const description =
          interaction.fields.getTextInputValue("embedDescription");
        const color =
          interaction.fields.getTextInputValue("embedColor") ||
          mConfig.embedColorPrimary;
        const thumbnail =
          interaction.fields.getTextInputValue("embedThumbnail") || null;
        const footer =
          interaction.fields.getTextInputValue("embedFooter") || null;

        const embed = new EmbedBuilder().setColor(color).setTimestamp();

        if (title) {
          embed.setTitle(title);
        }

        if (description) {
          embed.setDescription(description);
        }

        if (thumbnail) {
          embed.setThumbnail(thumbnail);
        }

        if (footer) {
          embed.setFooter({ text: footer });
        }

        await interaction.reply({ embeds: [embed] });
      } else {
        await interaction.reply({
          content: "This modal is not recognized",
          ephemeral: true,
        });
      }
    } else if (interaction.isStringSelectMenu()) {
      if (interaction.customId.startsWith("select-ticket-topic")) {
        const selectedTopic = interaction.values[0];
        const panelId = interaction.customId.split("_")[1];

        // Sprawdź, czy użytkownik już ma otwarty kanał ticket
        const existingChannel = interaction.guild.channels.cache.find(
          (channel) =>
            channel.name === `${selectedTopic}-${interaction.user.username}`
        );

        if (existingChannel) {
          return interaction.reply({
            content: `You already have an open ticket: ${existingChannel}`,
            ephemeral: true,
          });
        }

        const panel = await TicketPanel.findOne({
          panelId,
          guildId: interaction.guild.id,
        });

        if (!panel.adminRoleId) {
          return interaction.reply({
            content: "Admin role ID is missing in the database.",
            ephemeral: true,
          });
        }

        const adminRole = interaction.guild.roles.cache.get(panel.adminRoleId);

        if (!adminRole) {
          return interaction.reply({
            content: "The specified admin role does not exist.",
            ephemeral: true,
          });
        }

        // Create the ticket channel
        const ticketChannel = await interaction.guild.channels.create({
          name: `${selectedTopic}-${interaction.user.username}`,
          type: ChannelType.GuildText,
          parent: null, // Jeśli chcesz umieścić w konkretnej kategorii, zamień null na ID kategorii
          permissionOverwrites: [
            {
              id: interaction.guild.id,
              deny: [PermissionsBitField.Flags.ViewChannel],
            },
            {
              id: interaction.user.id,
              allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages,
              ],
            },
            {
              id: interaction.guild.roles.everyone.id,
              deny: [PermissionsBitField.Flags.ViewChannel],
            },
            {
              id: adminRole.id,
              allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.ManageMessages,
                PermissionsBitField.Flags.ReadMessageHistory,
                PermissionsBitField.Flags.ManageChannels,
              ],
            },
          ],
        });

        const welcomeEmbed = new EmbedBuilder()
          .setColor(mConfig.embedColorPrimary)
          .setAuthor({ name: interaction.user.username })
          .setTitle(`Welcome to your ticket!`)
          .setDescription(
            `Please describe your issue related to **${selectedTopic}**. A staff member will be with you shortly.`
          )
          .setFooter({ text: `Powered By ${client.user.tag}` });

        const closeButton = new ButtonBuilder()
          .setCustomId("close_ticket")
          .setLabel("Close Ticket")
          .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder().addComponents(closeButton);

        const welcomeMessage = await ticketChannel.send({
          embeds: [welcomeEmbed],
          components: [row],
        });

        await welcomeMessage.pin();

        await interaction.reply({
          content: `Your ticket has been created: ${ticketChannel}`,
          ephemeral: true,
        });
      }
    }
  },
};
