import { Client, Collection, GatewayIntentBits, ClientOptions } from 'discord.js';
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath, pathToFileURL } from 'url'; // Import for __dirname replacement
import * as logger from './logger.js'; // Note the .js extension
import { serverQueues } from './player.js'; // Note the .js extension

// --- ESM replacement for __dirname ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

class MusicBotClient extends Client {
    commands: Collection<string, any>;
    constructor(options: ClientOptions) {
        super(options);
        this.commands = new Collection();
    }
}

const client = new MusicBotClient({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});

async function loadCommands() {
    const commandsPath = path.join(__dirname, 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js') || file.endsWith('.ts'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const fileUrl = pathToFileURL(filePath).href;
        const command = await import(fileUrl);

        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
            logger.log(`Loaded command: /${command.data.name}`);
        }
    }
}

// --- Main execution in an async context ---
async function main() {
    await loadCommands();

    client.once('ready', () => {
        logger.log(`Bot is online as ${client.user?.tag}!`);
    });

    client.on('interactionCreate', async interaction => {
        if (!interaction.isChatInputCommand()) return;
        const command = (interaction.client as MusicBotClient).commands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.execute(interaction, serverQueues);
        } catch (error) {
            logger.error(`Error executing /${interaction.commandName}: ${error}`);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
            } else {
                await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
            }
        }
    });

    client.login(process.env.DISCORD_TOKEN);
}

main(); // Run the main function