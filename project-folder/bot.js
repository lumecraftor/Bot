require('dotenv').config();
const { Client, Intents } = require('discord.js');
const express = require('express');
const mongoose = require('mongoose');
const rateLimit = require('rate-limiter-flexible');
const obfuscateScript = require('./obfuscator/obfuscate');
const User = require('./models/User');
const Key = require('./models/Key');

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
const app = express();
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Database connected'))
    .catch((err) => console.error('Database connection failed:', err));

// Rate Limiting
const rateLimiter = new rateLimit.RateLimiterMemory({ points: 5, duration: 60 }); // 5 requests per minute

// Bot Commands
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const args = message.content.split(' ');
    const command = args[0];

    // Generate Key
    if (command === '!generate-key') {
        const existingKey = await Key.findOne({ isUsed: false });
        if (existingKey) {
            return message.reply(`Here is your unused key: \`${existingKey.key}\``);
        }

        const newKey = crypto.randomBytes(16).toString('hex');
        await new Key({ key: newKey }).save();
        message.reply(`Here is your new key: \`${newKey}\``);
    }

    // Obfuscate Script
    if (command === '!obfuscate') {
        try {
            await rateLimiter.consume(message.author.id);

            const script = args.slice(1).join(' ');
            if (!script) return message.reply('Please provide a script to obfuscate.');

            const obfuscated = obfuscateScript(script);
            message.reply(`Here is your obfuscated script:\n\`\`\`${obfuscated}\`\`\``);
        } catch (e) {
            return message.reply('You are being rate-limited. Please wait before trying again.');
        }
    }

    // Link Key to User
    if (command === '!link-key') {
        const userKey = args[1];
        if (!userKey) return message.reply('Please provide a valid key.');

        const key = await Key.findOne({ key: userKey, isUsed: false });
        if (!key) return message.reply('Invalid or already used key.');

        await new User({ discordID: message.author.id, key: userKey }).save();
        key.isUsed = true;
        await key.save();
        message.reply('Key successfully linked to your account!');
    }
});

client.once('ready', () => {
    console.log(`Bot logged in as ${client.user.tag}`);
});

// API for Admins
app.post('/admin/keys', async (req, res) => {
    const { count } = req.body;
    if (!count || count <= 0) return res.status(400).json({ error: 'Invalid count' });

    const keys = [];
    for (let i = 0; i < count; i++) {
        const newKey = crypto.randomBytes(16).toString('hex');
        await new Key({ key: newKey }).save();
        keys.push(newKey);
    }
    res.status(200).json({ keys });
});

// Start Bot and API
client.login(process.env.DISCORD_TOKEN);
app.listen(process.env.PORT, () => console.log(`API running on port ${process.env.PORT}`));
