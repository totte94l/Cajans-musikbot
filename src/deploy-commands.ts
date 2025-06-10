import { SlashCommandBuilder, REST, Routes } from 'discord.js';
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

// --- ESM replacement for __dirname ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const token = process.env.DISCORD_TOKEN!;
const clientId = process.env.CLIENT_ID!;
const guildId = process.env.GUILD_ID; // This one is optional, for prod you might want to use application commands instead

interface CommandModule {
    data: SlashCommandBuilder;
    execute: Function;
}

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js') || file.endsWith('.ts'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const fileUrl = pathToFileURL(filePath).href;
    const command = await import(fileUrl) as CommandModule;

    if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
    }
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);

(async () => {
    try {
        if (guildId) {
            // --- DEVELOPMENT MODE ---
            // Registering commands to a specific guild.
            console.log(`Started refreshing ${commands.length} application (/) commands for guild: ${guildId}`);
            await rest.put(
                Routes.applicationGuildCommands(clientId, guildId),
                { body: commands },
            );
            console.log(`Successfully reloaded commands for guild: ${guildId}`);

        } else {
            // --- PRODUCTION MODE ---
            // Registering commands globally.
            console.log(`Started refreshing ${commands.length} application (/) commands globally.`);
            await rest.put(
                Routes.applicationCommands(clientId),
                { body: commands },
            );
            console.log(`Successfully reloaded commands globally.`);
        }
    } catch (error) {
        console.error(error);
    }
})();