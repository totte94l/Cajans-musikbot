import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { GuildQueue } from '../types';

export const data = new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Displays the current music queue.');

export async function execute(interaction: ChatInputCommandInteraction, serverQueues: Map<string, GuildQueue>) {
    const guildId = interaction.guildId!;
    const queue = serverQueues.get(guildId);

    if (!queue || queue.songs.length === 0) {
        return interaction.reply({ content: 'The queue is currently empty!', ephemeral: true });
    }

    const [currentlyPlaying, ...upcomingSongsList] = queue.songs;

    const upcomingSongs = upcomingSongsList.slice(0, 10)
        .map((song, index) => `**${index + 1}.** ${song.title} (${song.duration})`)
        .join('\n');

    const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('Music Queue')
        .addFields(
            { name: '🎶 Now Playing', value: `${currentlyPlaying.title} (${currentlyPlaying.duration})` },
            { name: '📜 Up Next', value: upcomingSongs.length > 0 ? upcomingSongs : 'No more songs in the queue.' }
        )
        .setFooter({ text: `There are ${queue.songs.length} songs in total.` });

    await interaction.reply({ embeds: [embed] });
}