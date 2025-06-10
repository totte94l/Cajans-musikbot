import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('help')
    .setDescription('Shows a list of all available commands.');

export async function execute(interaction: ChatInputCommandInteraction) {
    const helpEmbed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('Musikbot Help')
        .setDescription('Here is a list of all my commands and how to use them:')
        .addFields(
            { name: '`/play <url>`', value: 'Plays a song directly from a YouTube or SoundCloud URL.' },
            { name: '`/search <song name>`', value: 'Searches YouTube for a song and adds it to the queue.' },
            { name: '`/skip`', value: 'Skips the currently playing song.' },
            { name: '`/queue`', value: 'Displays the current music queue.' },
            { name: '`/stop`', value: 'Stops the music, clears the queue, and disconnects the bot.' },
            { name: '`/about`', value: 'Shows information about the bot and its creator.' },
        )
        .setFooter({ text: 'Enjoy the music!' });

    await interaction.reply({ embeds: [helpEmbed] });
}