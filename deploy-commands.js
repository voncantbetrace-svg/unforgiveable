// Load environment variables
require('dotenv').config();

const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');

const { TOKEN, CLIENT_ID } = process.env;

// ✅ Only require TOKEN + CLIENT_ID now
if (!TOKEN || !CLIENT_ID) {
  console.error('❌ Missing TOKEN or CLIENT_ID in .env file.');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// --- COMMANDS ---
const commands = [
  new SlashCommandBuilder()
    .setName('panel')
    .setDescription('Show server control panel'),

  new SlashCommandBuilder()
    .setName('flood')
    .setDescription('Send a message multiple times')
    .addStringOption(option =>
      option.setName('message').setDescription('Message to send').setRequired(true))
    .addIntegerOption(option =>
      option.setName('count').setDescription('How many times')),

  new SlashCommandBuilder()
    .setName('nuke')
    .setDescription('Wipe this channel and drop visuals'),

  new SlashCommandBuilder()
    .setName('ghost')
    .setDescription('Send 10 phantom pings to a target')
    .addMentionableOption(o =>
      o.setName('target').setDescription('Target to ghost').setRequired(true)),

  new SlashCommandBuilder()
    .setName('hook')
    .setDescription('Execute a webhook burst')
    .addStringOption(o =>
      o.setName('content').setDescription('Message').setRequired(true))
    .addIntegerOption(o =>
      o.setName('count').setDescription('Amount (1-20)').setMinValue(1).setMaxValue(20))
].map(cmd => cmd.toJSON());

// --- GLOBAL COMMAND REGISTRATION ---
const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log('🌍 Registering GLOBAL commands...');
    
    await rest.put(
      Routes.applicationCommands(CLIENT_ID), // ✅ GLOBAL HERE
      { body: commands }
    );

    console.log('✅ Global commands registered!');
  } catch (err) {
    console.error('❌ Failed to register commands:', err);
  }
})();

// --- INTERACTIONS ---
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName, options, channel, member } = interaction;

  try {
    if (commandName === 'panel') {
      await interaction.reply({ content: 'Panel not set up yet.', ephemeral: true });
    }

    if (commandName === 'flood') {
      const message = options.getString('message');
      const count = options.getInteger('count') || 1;

      if (!channel || !channel.isTextBased()) {
        return interaction.reply({ content: "Can't send messages here.", ephemeral: true });
      }

      for (let j = 0; j < count; j++) {
        await channel.send(message);
      }

      await interaction.reply({ content: `Sent ${count} messages.`, ephemeral: true });
    }

    if (commandName === 'nuke') {
      if (!member.permissions.has('ManageChannels')) {
        return interaction.reply({ content: 'No permission.', ephemeral: true });
      }

      const position = channel.position;
      const parent = channel.parentId;

      const newChannel = await channel.clone({ parent });
      await channel.delete();
      await newChannel.setPosition(position);

      await newChannel.send('Channel reset.');
    }

    if (commandName === 'ghost') {
      const target = options.getMentionable('target');

      await interaction.reply({ content: 'Ghosting...', ephemeral: true });

      for (let i = 0; i < 10; i++) {
        const msg = await channel.send(`${target}`);
        await msg.delete().catch(() => {});
      }
    }

    if (commandName === 'hook') {
      const content = options.getString('content');
      const count = options.getInteger('count') || 5;

      await interaction.reply({ content: 'Sending webhook...', ephemeral: true });

      const webhook = await channel.createWebhook({
        name: 'Bot',
      });

      for (let i = 0; i < count; i++) {
        await webhook.send(content);
      }

      setTimeout(() => webhook.delete().catch(() => {}), 5000);
    }

  } catch (err) {
    console.error('❌ Interaction error:', err);

    if (!interaction.replied) {
      await interaction.reply({
        content: 'Error occurred.',
        ephemeral: true
      });
    }
  }
});

// --- ERROR HANDLER ---
process.on("unhandledRejection", err => {
  console.error("Unhandled rejection:", err);
});

// --- LOGIN ---
client.login(TOKEN);
