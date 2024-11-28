module.exports = (client) => {
    client.on('interactionCreate', async (interaction) => {
      if (!interaction.isCommand()) return;
  
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
  
      try {
        await command.execute(interaction, client);
      } catch (error) {
        console.error(error);
        await interaction.reply({
          content: 'Wystąpił błąd przy wykonywaniu komendy!',
          ephemeral: true,
        });
      }
    });
  };
  