import { AudioPlayerStatus, createAudioPlayer, createAudioResource, joinVoiceChannel } from "@discordjs/voice";
import { ChatInputCommandInteraction, GuildMember } from "discord.js";
import { spawn } from "child_process";
import * as logger from './logger';
import { GuildQueue, Song } from "./types";

// The state of all server queues now lives here, in the player module.
export const serverQueues = new Map<string, GuildQueue>();

export async function playNextSong(guildId: string) {
    const queue = serverQueues.get(guildId);
    if (!queue) return;

    if (queue.songs.length === 0) {
        queue.isPlaying = false;
        setTimeout(() => {
            const currentQueue = serverQueues.get(guildId);
            if (currentQueue && !currentQueue.isPlaying && currentQueue.songs.length === 0) {
                currentQueue.connection.destroy();
                serverQueues.delete(guildId);
                logger.log('Left voice channel due to inactivity.', guildId);
            }
        }, 120000);
        return;
    }

    queue.isPlaying = true;
    const song = queue.songs[0];
    logger.log(`Starting playback: "${song.title}"`, guildId);

    try {
        const ytDlpProcess = spawn('yt-dlp', [
            song.url, '-f', 'bestaudio[ext=opus]/bestaudio/best', '-o', '-', '--quiet'
        ]);
        queue.process = ytDlpProcess;
        const resource = createAudioResource(ytDlpProcess.stdout);
        queue.player.play(resource);

        ytDlpProcess.on('error', error => logger.error(`yt-dlp process error: ${error.message}`, guildId));
    } catch (err) {
        logger.error(`Error playing song: ${err}`, guildId);
        queue.songs.shift();
        playNextSong(guildId);
    }
}

export async function enqueueSong(query: string, interaction: ChatInputCommandInteraction) {
    const guildId = interaction.guildId!;
    const member = interaction.member as GuildMember;

    if (!member.voice.channel) {
        return interaction.editReply('You need to be in a voice channel to play music!');
    }

    let queue = serverQueues.get(guildId);

    if (!queue) {
        const connection = joinVoiceChannel({
            channelId: member.voice.channel.id,
            guildId: guildId,
            adapterCreator: interaction.guild!.voiceAdapterCreator,
        });

        const player = createAudioPlayer();
        connection.subscribe(player);

        queue = {
            connection: connection,
            player: player,
            songs: [],
            isPlaying: false,
            lastInteraction: interaction
        };
        serverQueues.set(guildId, queue);

        player.on(AudioPlayerStatus.Idle, () => {
            const currentQueue = serverQueues.get(guildId);
            if (currentQueue?.isPlaying) {
                currentQueue.songs.shift();
                playNextSong(guildId);
            }
        });
        player.on('error', err => logger.error(`Audio player error: ${err.message}`, guildId));
    }

    queue.lastInteraction = interaction;

    try {
        const searchProcess = spawn('yt-dlp', [query, '--dump-json', '--no-playlist', '--quiet']);
        let jsonData = '';
        searchProcess.stdout.on('data', (data) => jsonData += data);

        searchProcess.on('close', (code) => {
            if (code !== 0 || !jsonData) {
                return interaction.editReply("I couldn't find a video for that query.");
            }
            try {
                const videoInfo = JSON.parse(jsonData);
                const song: Song = {
                    title: videoInfo.title,
                    url: videoInfo.webpage_url,
                    duration: new Date(videoInfo.duration * 1000).toISOString().slice(11, 19),
                    requestedBy: interaction.user.tag,
                };

                const currentQueue = serverQueues.get(guildId)!;
                currentQueue.songs.push(song);
                interaction.editReply(`✅ Added **${song.title}** to the queue!`);

                if (!currentQueue.isPlaying) {
                    playNextSong(guildId);
                }
            } catch (e) {
                interaction.editReply("I found the video, but couldn't process its details.");
            }
        });
    } catch (err) {
        interaction.editReply('An error occurred while trying to get the video.');
    }
}