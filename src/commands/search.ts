import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { enqueueSong } from '../player';

export const data = new SlashCommandBuilder()
    .setName('search')
    .setDescription('Searches YouTube for a song and adds it to the queue.')
    .addStringOption(option =>
        option.setName('query')
            .setDescription('The song name to search for')
            .setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction) {
    const query = interaction.options.getString('query', true);
    const ytSearchQuery = `ytsearch1:"${query}"`;

    await interaction.deferReply();

    await enqueueSong(ytSearchQuery, interaction);
}