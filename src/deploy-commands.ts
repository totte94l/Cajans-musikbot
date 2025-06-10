import { SlashCommandBuilder, REST, Routes } from 'discord.js';
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

// --- ESM replacement for __dirname ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

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
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        const data: any = await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID!, process.env.GUILD_ID!),
            { body: commands },
        );

        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        console.error(error);
    }
})();