module.exports = (client) => {
    client.once('ready', () => {
      console.log(`Zalogowano jako ${client.user.tag}`);
    });
  };
  