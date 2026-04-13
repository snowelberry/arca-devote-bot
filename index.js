const { 
    Client, 
    GatewayIntentBits, 
    REST, 
    Routes, 
    SlashCommandBuilder 
} = require("discord.js");

const express = require("express");
const noblox = require("noblox.js");
(async () => {
    try {
        const user = await noblox.setCookie(process.env.COOKIE);
        console.log("Cookie válida, logueado como:", user.UserName);
    } catch (err) {
        console.error("COOKIE INVÁLIDA:", err);
    }
})();

// 🔑 CONFIG
const TOKEN = process.env.TOKEN;
const CLIENT_ID = "1492783349624733786";
const VERIFIED_ROLE_NAME = "Verified";
const DEVOTE_CHANNEL_ID = "1404343622941540444";

// 👑 ROBLOX
const GROUP_ID = "33627323";

const RANKS = {
    registered: 2,
    insane: 3
};

const GAMEPASS_ID = 685541051;

const PUBLIC_CHANNEL_ID = "1163122428457799720";
const LOG_CHANNEL_ID = "1404183947679891627";

const ROBLOX_COOKIE = process.env.COOKIE;

// 🤖 CLIENT
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

// 🧠 REQUESTS
const devoteList = {};

// 🌐 SERVER
const app = express();
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Arca System Online");
});

app.get("/verify", (req, res) => {
    res.send("OK");
});

app.get("/check-devote", (req, res) => {
    res.send("Endpoint activo");
});

// 🔥 ENDPOINT
app.post("/check-devote", async (req, res) => {
    const { username } = req.body;

    const data = devoteList[username];
    if (!data) return res.send("NOT_FOUND");

    if (Date.now() > data.expiresAt) {
        delete devoteList[username];
        return res.send("EXPIRED");
    }

    try {
        const userId = await noblox.getIdFromUsername(username);

        // 🔍 Grupo
const rank = await noblox.getRankInGroup(GROUP_ID, userId);

if (rank === 0) {
    delete devoteList[username];
    return res.send("NOT_IN_GROUP");
}

        const currentRank = groupData.Rank;
// 🚫 SEGURIDAD STAFF
        if (currentRank > 3) {
            delete devoteList[username];
            return res.send("RANK_TOO_HIGH");
        }

        // 🧠 GAMEPASS (solo rank 3)
        if (data.selectedRank === "insane") {
            const ownsGamepass = await noblox.getPlayerAssetOwnership(userId, GAMEPASS_ID);

            if (!ownsGamepass) {
                delete devoteList[username];
                return res.send("NO_GAMEPASS");
            }
        }

        // 👑 RANK
        const targetRank = RANKS[data.selectedRank];
        await noblox.setRank(GROUP_ID, userId, targetRank);

        console.log(`✅ ${username} rankeado a ${targetRank}`);
// 📢 MENSAJE
        const publicChannel = client.channels.cache.get(PUBLIC_CHANNEL_ID);
        if (publicChannel) {
            publicChannel.send(
                `<@${data.discordId}> has devoted themselves into our community! Please welcome them...`
            );
        }


        // 📜 LOG
        const logChannel = client.channels.cache.get(LOG_CHANNEL_ID);
        if (logChannel) {
            logChannel.send(
                `✅ <@${data.discordId}> has been devoted as **${username}** (Rank ${targetRank})`
            );
        }

        delete devoteList[username];
        return res.send("SUCCESS");

    } catch (err) {
        console.error(err);
        return res.send("ERROR");
    }
});

app.listen(3000, () => {
    console.log("Servidor activo");
});

// 🧩 COMANDO
const commands = [
    new SlashCommandBuilder()
        .setName("devote")
        .setDescription("Start devotion")
        .addStringOption(option =>
            option.setName("rank")
                .setDescription("Choose your rank")
                .setRequired(true)
                .addChoices(
                    { name: "✏ Registered", value: "registered" },
                    { name: "🧠 Insane Voyager", value: "insane" }
                )
        )
        .toJSON()
];

// 🔄 REGISTER
const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
})();

// 🤖 READY
client.once("ready", () => {
    console.log(`Bot conectado como ${client.user.tag}`);
});
// 🎯 INTERACTION
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === "devote") {

        if (interaction.channelId !== DEVOTE_CHANNEL_ID) {
            return interaction.reply({
                content: "❌ Use the correct channel. __ https://discord.com/channels/993236791412932780/1404343622941540444 __",
                ephemeral: true
            });
        }

        const member = interaction.member;

        const hasRole = member.roles.cache.some(
            role => role.name === VERIFIED_ROLE_NAME
        );

        if (!hasRole) {
            return interaction.reply({
                content: "❌ You must verify first.",
                ephemeral: true
            });
        }

        const username = member.nickname || interaction.user.username;
        const selectedRank = interaction.options.getString("rank");

        devoteList[username] = {
            discordId: interaction.user.id,
            selectedRank,
            expiresAt: Date.now() + 300000
        };

        await interaction.reply({
    content: `🎗️ **Arca** *awaits you here*, ***${username}...***

🔗 __ https://www.roblox.com/games/15928047957/Ranking-Center __

🧬 Selected Rank: ***${selectedRank === "registered" ? "✏️ Registered" : "🧠 Insane Voyager"}***`,
    ephemeral: true
});
    }
});

// 🔐 LOGIN
client.login(TOKEN);

noblox.setCookie(ROBLOX_COOKIE)
.then(() => console.log("✅ Roblox conectado"))
.catch(console.error);
