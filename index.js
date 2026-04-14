const { 
    Client, 
    GatewayIntentBits, 
    REST, 
    Routes, 
    SlashCommandBuilder 
} = require("discord.js");

const express = require("express");
const noblox = require("noblox.js");

// 🔑 CONFIG
const TOKEN = "MTQ5Mjc4MzM0OTYyNDczMzc4Ng.GXE84E.n2GkL22-QKgos25wVxyZT04bXatNNJHxIduPAo";
const CLIENT_ID = "1492783349624733786";
const VERIFIED_ROLE_NAME = "Verified";
const DEVOTE_CHANNEL_ID = "1404343622941540444";

// 👑 ROBLOX
const GROUP_ID = 33627323;

const RANKS = {
    registered: 2,
    insane: 3
};

const GAMEPASS_ID = 685541051;

const PUBLIC_CHANNEL_ID = "1163122428457799720";
const LOG_CHANNEL_ID = "1404183947679891627";

const ROBLOX_COOKIE = "_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_CAEaAhADIhsKBGR1aWQSEzYxNDUyODQyNjc3ODcwNjU0OTAoBA.AERuB8qpcjIQqskZvf7H1_M7DNhaJ42_Y2DG9jEMP8EOj_2YN4S_DsPxcVyMdKuUwKMPzGl1r0uZiCA-AQFBQLrjlUgHAIARYYWLBb7fe9yF4b5kM42DY7WsdAq6ZtqzGyS3JcbAuPTGKqWfPQU_P9NzRK0INaFw_2KIBBC9-UQ1GrvzszXqnVw57E9yJQSiiGLCMr2Sd25ALTNEtAfRRVsOdqstlNx2_UPX-JB6pVvaGn5v24HLtaGHvCCYQTsiy1cfXZj0w4s0fvVpJiOZV201Xk6zosopnwybYllqfU3brqIY6EbIFbraW01iE1srbWALYOdTbg6exYgKTZh7RgzGGWp5avZxsTVp8Z35BICGls-3jTKgY-vqxVeTFSnbjZvsEdTfomLzADhmF9ogvjW-tJzdlt4TTUnAUJQb6l3R8wEOzZY2jOlt_FtzFeNAKFylQcg_VwO_rhv0cPNDzgoMS1Vrlc4yscADGBMpAHeM0gcxIXEJFyOMZZX8qsO0iiYgKo5cvZX5kdNdp994_TPvIWb5HyVYL8_G_reVeyh68Zsynt61S9LhK6pd9f-psA1YrgMnTHZZpjuowB_vjiCUuYEyKWtD9LrbTdJ3F5P_ld60jqsFj2ubrz7uIK12BzvBViD5dtR9wC13UhTnKbLBY-c05ZYYr-he1UKZTOKKzxs_u8UMBWsLF9wN2qi4uH2KbT0Gw9bG78EHYqwB5a8xJcJzmCBu7YRfz2bgyul2CAkwGP7MgH93NvyaJgwZkpTldvC4boh8Kap-Ub4bBpYFx9jnCD3ccG6qIGeEGDUm1Mo4uRIqCYqk2rplOY3CQruEJs4e2LfzRPtwxdnclvbBg2AdH28adyVmQKMB0QL03tglqrCagp8RVmdSehuuEWk4RLsF7gCg3aW7wdRM4NC5DBNgYKwxKxEZb6qFqAyJhc7BQ6GljQ002WSYIT7YX_vV_A";

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
        const groups = await noblox.getGroups(userId);
        const groupData = groups.find(g => g.Id === GROUP_ID);

        if (!groupData) {
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
                    { name: "📝Registered", value: "registered" },
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
                content: "❌ Use the correct channel.",
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
