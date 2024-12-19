const { SlashCommandBuilder, ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder, PermissionsBitField } = require('discord.js');
const Eventss = require('../../models/events');
const Guild = require("../../models/guild");

module.exports = {
  data: new SlashCommandBuilder()
    .setName('event')
    .setDescription('Event management commands')
    .addSubcommand(subcommand =>
      subcommand
        .setName('create')
        .setDescription('Create a new event')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('reactions')
        .setDescription('Add reactions to the event thread')
        .addStringOption(option =>
          option.setName('emojis')
            .setDescription('List of emojis to add, separated by spaces')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('ping')
        .setDescription('Ping users who reacted with a specific emoji')
        .addStringOption(option =>
          option
            .setName('emoji')
            .setDescription('Emoji to check reactions for')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('ping_message')
            .setDescription('Message to send when pinging users')
            .setRequired(true)
        )
    ),

  async execute(client, interaction) {
    const user = interaction.user;
    const guildId = interaction.guild.id;
    console.log('Event creation started by user:', interaction.user.username);

    const guildData = await Guild.findOne({ guildId });
    const eventConfig = await Eventss.findOne({ guildId });

    if (interaction.options.getSubcommand() === 'create') {
      try {

        if (!guildData || !eventConfig || !guildData.enabledSystems?.events || !eventConfig.eventChannelId) {
          console.log('Event system disabled or no event channel set.');
          return interaction.reply({
            content: 'The event system is disabled or no event channel is set. Please ask an administrator to configure it.',
            ephemeral: true,
          });
        }

        const eventChannel = interaction.guild.channels.cache.get(eventConfig.eventChannelId);
        if (!eventChannel) {
          console.log('Event channel not found.');
          return interaction.reply({
            content: 'Event channel not found. Please ask an administrator to configure it.',
            ephemeral: true,
          });
        }

        // Create and show the modal
        const modal = new ModalBuilder()
          .setCustomId('eventModal')
          .setTitle('Create New Event');

        const titleInput = new TextInputBuilder()
          .setCustomId('titleInput')
          .setLabel("What will be the title of the event?")
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        const descriptionInput = new TextInputBuilder()
          .setCustomId('descriptionInput')
          .setLabel("What will be the description of the event?")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true);

        const dateInput = new TextInputBuilder()
          .setCustomId('dateInput')
          .setLabel("Date of the event (format: YYYY-MM-DDTHH:MM)")
          .setStyle(TextInputStyle.Short)
          .setPlaceholder("Example: 2024-12-31T18:00")
          .setRequired(false);

        const lengthInput = new TextInputBuilder()
          .setCustomId('lengthInput')
          .setLabel("Duration of the event (format: HH:MM)")
          .setStyle(TextInputStyle.Short)
          .setPlaceholder("Example: 01:30")
          .setRequired(false);

        modal.addComponents(
          new ActionRowBuilder().addComponents(titleInput),
          new ActionRowBuilder().addComponents(descriptionInput),
          new ActionRowBuilder().addComponents(dateInput),
          new ActionRowBuilder().addComponents(lengthInput)
        );

        await interaction.showModal(modal);

        // Handle modal submission
        const modalSubmission = await interaction.awaitModalSubmit({ time: 60000 });
        const title = modalSubmission.fields.getTextInputValue('titleInput');
        const description = modalSubmission.fields.getTextInputValue('descriptionInput');
        const dateInputValue = modalSubmission.fields.getTextInputValue('dateInput');
        const lengthInputValue = modalSubmission.fields.getTextInputValue('lengthInput');

        let date = new Date();
        if (dateInputValue) {
          const parsedDate = new Date(dateInputValue);
          if (!isNaN(parsedDate)) {
            date = parsedDate;
          } else {
            return modalSubmission.reply({ content: 'Invalid date format. Please use YYYY-MM-DDTHH:MM.', ephemeral: true });
          }
        }

        let length = { hours: 0, minutes: 0 };
        if (lengthInputValue) {
          const [hours, minutes] = lengthInputValue.split(':').map(Number);
          if (!isNaN(hours) && !isNaN(minutes)) {
            length = { hours, minutes };
          } else {
            return modalSubmission.reply({ content: 'Invalid duration format. Please use HH:MM.', ephemeral: true });
          }
        }

        const endDate = new Date(date);
        endDate.setHours(endDate.getHours() + length.hours);
        endDate.setMinutes(endDate.getMinutes() + length.minutes);

        // Create the event embed
        const eventEmbed = new EmbedBuilder()
          .setTitle(title)
          .setDescription(description)
          .setColor('#00FF00') // Green color
          .addFields(
            { name: 'Start Time', value: `<t:${Math.floor(date.getTime() / 1000)}:F>`, inline: true },
            { name: 'End Time', value: `<t:${Math.floor(endDate.getTime() / 1000)}:t>`, inline: true },
            { name: 'Time Remaining', value: `<t:${Math.floor(date.getTime() / 1000)}:R>`, inline: false }
          )
          .setFooter({ text: `Created by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
          .setTimestamp();

        // Create the event thread
        const thread = await eventChannel.threads.create({
          name: title,
          message: {
            embeds: [eventEmbed],
          },
        });

        console.log('Event thread created:', thread.name);

        await modalSubmission.reply({ content: `Event created successfully in ${eventChannel}.`, ephemeral: true });
      } catch (error) {
        console.error('Error creating event:', error);
        if (interaction.replied || interaction.deferred) {
          return interaction.followUp({ content: 'An error occurred while creating the event. Please try again later.', ephemeral: true });
        } else {
          return interaction.reply({ content: 'An error occurred while creating the event. Please try again later.', ephemeral: true });
        }
      }
    } else if (interaction.options.getSubcommand() === 'reactions') {
      try {
        if (!guildData || !eventConfig || !guildData.enabledSystems?.events || !eventConfig.eventChannelId) {
          console.log('Event system disabled or no event channel set.');
          return interaction.reply({
            content: 'The event system is disabled or no event channel is set. Please ask an administrator to configure it.',
            ephemeral: true,
          });
        }
        const thread = interaction.channel;

        // Verify if the command is executed in a thread
        if (!thread.isThread()) {
          return interaction.reply({ content: 'This command can only be used in an event thread.', ephemeral: true });
        }

        // Check if the user has the required permissions (administrator or organizer)
        const member = await interaction.guild.members.fetch(user.id);
        const isAdmin = member.permissions.has(PermissionsBitField.Flags.Administrator);
        const isOrganizer = thread.ownerId === user.id;

        if (!isAdmin && !isOrganizer) {
          return interaction.reply({ content: 'You need to be the event organizer or an administrator to use this command.', ephemeral: true });
        }

        // Get the emojis from the command option
        const emojis = interaction.options.getString('emojis').split(/\s+/);

        // Fetch the starter message of the thread
        const starterMessage = await thread.fetchStarterMessage();
        if (!starterMessage) {
          return interaction.reply({ content: 'Failed to fetch the starter message of the thread.', ephemeral: true });
        }

        // Add each emoji as a reaction
        for (const emoji of emojis) {
          try {
            await starterMessage.react(emoji);
          } catch (error) {
            console.warn(`Failed to react with emoji "${emoji}":`, error.message);
          }
        }

        return interaction.reply({ content: 'Reactions have been added to the event.', ephemeral: true });
      } catch (error) {
        console.error('Error in /event reactions command:', error);
        return interaction.reply({ content: 'An error occurred while adding reactions. Please try again later.', ephemeral: true });
      }
    }else if (interaction.options.getSubcommand() === 'ping') {
      try {
        if (!guildData || !eventConfig || !guildData.enabledSystems?.events || !eventConfig.eventChannelId) {
          console.log('Event system disabled or no event channel set.');
          return interaction.reply({
            content: 'The event system is disabled or no event channel is set. Please ask an administrator to configure it.',
            ephemeral: true,
          });
        }
    
        const thread = interaction.channel;
    
        // Verify if the command is executed in a thread
        if (!thread.isThread()) {
          return interaction.reply({ content: 'This command can only be used in an event thread.', ephemeral: true });
        }
    
        // Check if the user has the required permissions (administrator or organizer)
        const member = await interaction.guild.members.fetch(user.id);
        const isAdmin = member.permissions.has(PermissionsBitField.Flags.Administrator);
        const isOrganizer = thread.ownerId === user.id;
    
        if (!isAdmin && !isOrganizer) {
          return interaction.reply({ content: 'You need to be the event organizer or an administrator to use this command.', ephemeral: true });
        }
    
        // Get the emoji and ping message from the command options
        const emoji = interaction.options.getString('emoji');
        const pingMessage = interaction.options.getString('ping_message');
    
        // Fetch the message by ID
        const messageId = await thread.fetchStarterMessage();
        const message = await thread.messages.fetch(messageId);
        if (!message) {
          return interaction.reply({
            content: 'Message not found. Please provide a valid message ID.',
            ephemeral: true,
          });
        }
    
        // Find the reaction by emoji
        const reaction = message.reactions.cache.find(r => r.emoji.name === emoji || r.emoji.id === emoji);
        if (!reaction) {
          return interaction.reply({
            content: `No reactions found with the emoji "${emoji}".`,
            ephemeral: true,
          });
        }
    
        // Fetch all users who reacted with the specified emoji
        const users = await reaction.users.fetch();
        const userMentions = users.map(user => `<@${user.id}>`).join(', ');
    
        if (!userMentions) {
          return interaction.reply({
            content: 'No users reacted with the specified emoji.',
            ephemeral: true,
          });
        }
    
        // Send the ping message
        await interaction.reply({
          content: `${pingMessage}\n${userMentions}`,
          allowedMentions: { users: users.map(user => user.id) },
        });
      } catch (error) {
        console.error('Error in /event ping command:', error);
        interaction.reply({
          content: 'An error occurred while executing this command. Please try again later.',
          ephemeral: true,
        });
      }
    }
    
  },
};
