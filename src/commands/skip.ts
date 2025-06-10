import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skips the currently playing song.');

export async function execute(interaction: ChatInputCommandInteraction, serverQueues: Map<string, any>) {
    const guildId = interaction.guildId!;
    const queue = serverQueues.get(guildId);

    if (!queue || !queue.isPlaying) {
        return interaction.reply({ content: 'There is no song currently playing to skip!', ephemeral: true });
    }
    
    queue.player.stop(true);

    await interaction.reply('⏭️ Skipped!');
}