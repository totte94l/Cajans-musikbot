import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { enqueueSong } from '../player';

export const data = new SlashCommandBuilder()
    .setName('play')
    .setDescription('Plays a song from a YouTube or SoundCloud URL.')
    .addStringOption(option =>
        option.setName('url')
            .setDescription('The URL of the song to play')
            .setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction) {
    const url = interaction.options.getString('url', true);

    await interaction.deferReply();
    await enqueueSong(url, interaction);
}