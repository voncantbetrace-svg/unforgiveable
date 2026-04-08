// Try to load dotenv safely (won't crash if not installed)
try {
  require("dotenv").config();
} catch (err) {
  console.log("dotenv not found, using normal environment variables");
}

const {
  Client,
  GatewayIntentBits,
  Events,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder
} = require("discord.js");

// Pull from env OR fallback
const TOKEN = process.env.TOKEN || "PASTE_YOUR_TOKEN_HERE";
const CLIENT_ID = process.env.CLIENT_ID || "PASTE_CLIENT_ID";

// ❌ GUILD_ID NOT NEEDED FOR GLOBAL
if (!TOKEN || !CLIENT_ID) {
  console.error("❌ Missing TOKEN / CLIENT_ID");
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// cooldowns
const cooldowns = new Map();

// color map
const COLORS = {
  red: 0xff0000,
  blue: 0x0064ff,
  green: 0x00c800,
  yellow: 0xffff00,
  purple: 0xa000ff,
  orange: 0xffa500
};

// slash commands
const commands = [
  new SlashCommandBuilder()
    .setName("sendmessage")
    .setDescription("Send a message")
    .addStringOption(opt =>
      opt.setName("message").setDescription("Message").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("sendembed")
    .setDescription("Send an embed")
    .addStringOption(opt =>
      opt.setName("title").setDescription("Title").setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName("message").setDescription("Message").setRequired(true)
    )
    .addStringOption(opt =>
      opt
        .setName("color")
        .setDescription("Color")
        .setRequired(true)
        .addChoices(
          { name: "Red", value: "red" },
          { name: "Blue", value: "blue" },
          { name: "Green", value: "green" },
          { name: "Yellow", value: "yellow" },
          { name: "Purple", value: "purple" },
          { name: "Orange", value: "orange" }
        )
    )
].map(c => c.toJSON());

// ✅ GLOBAL command registration
const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  try {
    console.log("🌍 Registering GLOBAL commands...");

    await rest.put(
      Routes.applicationCommands(CLIENT_ID), // ✅ GLOBAL HERE
      { body: commands }
    );

    console.log("✅ Global commands registered!");
  } catch (err) {
    console.error("❌ Command registration failed:", err);
  }
})();

// ready event
client.once(Events.ClientReady, () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// interaction handler
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const userId = interaction.user.id;
  const now = Date.now();
  const cooldown = 3000;

  const last = cooldowns.get(userId) || 0;
  if (now - last < cooldown) {
    return interaction.reply({
      content: "Slow down a bit...",
      ephemeral: true
    });
  }

  cooldowns.set(userId, now);

  try {
    // sendmessage
    if (interaction.commandName === "sendmessage") {
      const msg = interaction.options.getString("message");

      await interaction.reply({ content: "Sent.", ephemeral: true });

      await interaction.followUp({
        content: msg.replace(/\\n/g, "\n")
      });
    }

    // sendembed
    if (interaction.commandName === "sendembed") {
      const title = interaction.options.getString("title");
      const message = interaction.options.getString("message");
      const color = interaction.options.getString("color");

      const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(message.replace(/\\n/g, "\n"))
        .setColor(COLORS[color] || 0xffffff);

      await interaction.reply({ content: "Embed sent.", ephemeral: true });
      await interaction.followUp({ embeds: [embed] });
    }
  } catch (err) {
    console.error("❌ Interaction error:", err);
    if (!interaction.replied) {
      interaction.reply({ content: "Error occurred.", ephemeral: true });
    }
  }
});

// login
client.login(TOKEN);
