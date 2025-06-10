import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stops playback, clears the queue, and leaves the channel.');

export async function execute(interaction: ChatInputCommandInteraction, serverQueues: Map<string, any>) {
    const guildId = interaction.guildId!;
    const queue = serverQueues.get(guildId);

    if (!queue) {
        return interaction.reply({ content: 'There is nothing to stop!', ephemeral: true });
    }

    // Clear song array and stop processes
    queue.songs = [];
    if (queue.process) {
        queue.process.kill();
    }
    queue.player.stop(true);
    queue.connection.destroy();

    // Delete the queue from the global map
    serverQueues.delete(guildId);

    await interaction.reply('⏹️ Playback stopped, queue cleared, and I have left the channel!');
}