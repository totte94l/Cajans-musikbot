import {
    Client, GatewayIntentBits, ChannelType, EmbedBuilder, Collection,
    ChatInputCommandInteraction, GuildMember,
    ClientOptions
} from 'discord.js';
import {
    joinVoiceChannel, VoiceConnectionStatus, createAudioPlayer, createAudioResource,
    AudioPlayerStatus, VoiceConnection, AudioPlayer,
} from '@discordjs/voice';
import { spawn, ChildProcess } from 'child_process';
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import * as logger from './logger';

import { Song, GuildQueue } from './types';
import { serverQueues } from './player';

dotenv.config();

// --- DATA STRUCTURES ---

// Extend the base Client to include a 'commands' property
class MusicBotClient extends Client {
    commands: Collection<string, any>;

    constructor(options: ClientOptions) {
        super(options);
        this.commands = new Collection();
    }
}

const client = new MusicBotClient({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent,
    ],
});

// --- DYNAMIC COMMAND LOADING ---
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        logger.log(`Loaded command: /${command.data.name}`);
    } else {
        logger.warn(`The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}


client.once('ready', () => {
    logger.log(`Bot is online as ${client.user?.tag}!`);
});

// --- SLASH COMMAND EVENT LISTENER ---
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = (interaction.client as MusicBotClient).commands.get(interaction.commandName);

    if (!command) {
        logger.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

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