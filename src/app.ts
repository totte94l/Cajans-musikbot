import { Client, GatewayIntentBits, ChannelType, Message, EmbedBuilder } from 'discord.js';
import {
    joinVoiceChannel,
    VoiceConnectionStatus,
    createAudioPlayer,
    createAudioResource,
    AudioPlayerStatus,
    VoiceConnection,
    AudioPlayer,
} from '@discordjs/voice';
import { spawn, ChildProcess } from 'child_process';
import dotenv from 'dotenv';
import * as logger from './logger'; // Import our new logger

dotenv.config();

// --- DATA STRUCTURES ---
interface Song {
    title: string;
    url: string;
    duration: string;
    requestedBy: string;
}

interface GuildQueue {
    connection: VoiceConnection;
    player: AudioPlayer;
    process?: ChildProcess;
    songs: Song[];
    isPlaying: boolean;
}

const serverQueues = new Map<string, GuildQueue>();


const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent,
    ],
});

client.once('ready', () => {
    logger.log('Bot is online and ready!');
});


async function playNextSong(guildId: string) {
    const queue = serverQueues.get(guildId);
    if (!queue) {
        logger.warn('playNextSong was called with no queue.', guildId);
        return;
    }

    if (queue.songs.length === 0) {
        queue.isPlaying = false;
        logger.log('Queue is empty. Setting 2 minute inactivity timer.', guildId);
        setTimeout(() => {
            const currentQueue = serverQueues.get(guildId);
            if (currentQueue && !currentQueue.isPlaying && currentQueue.songs.length === 0) {
                currentQueue.connection.destroy();
                serverQueues.delete(guildId);
                logger.log('Left voice channel due to inactivity.', guildId);
            }
        }, 120000); // 2 minutes
        return;
    }

    queue.isPlaying = true;
    const song = queue.songs[0];
    logger.log(`Starting playback: "${song.title}"`, guildId);

    try {
        const ytDlpProcess = spawn('yt-dlp', [
            song.url,
            '-f', 'bestaudio[ext=opus]/bestaudio/best',
            '-o', '-',
            '--quiet', // Add this flag to suppress yt-dlp's own console output
        ]);
        queue.process = ytDlpProcess;

        const resource = createAudioResource(ytDlpProcess.stdout);
        queue.player.play(resource);

        // We only log stderr if the process closes with an error, reducing console spam.
        let stderrOutput = '';
        ytDlpProcess.stderr.on('data', data => stderrOutput += data);

        ytDlpProcess.on('error', error => {
            logger.error(`yt-dlp process error: ${error.message}`, guildId);
        });

        ytDlpProcess.on('close', code => {
            if (code !== 0) {
                logger.error(`yt-dlp process exited with code ${code}. Stderr: ${stderrOutput}`, guildId);
            }
        });

    } catch (err) {
        logger.error(`Error playing song: ${err}`, guildId);
        queue.songs.shift();
        playNextSong(guildId);
    }
}

async function enqueueSong(query: string, message: Message) {
    const guildId = message.guild?.id;
    if (!guildId || !message.guild) return;

    const member = message.member;
    if (!member || !member.voice.channel) {
        return message.reply('You need to be in a voice channel to play music!');
    }

    let queue = serverQueues.get(guildId);

    if (!queue) {
        logger.log(`Creating new queue for guild.`, guildId);
        const connection = joinVoiceChannel({
            channelId: member.voice.channel.id,
            guildId: guildId,
            adapterCreator: message.guild.voiceAdapterCreator,
        });

        const player = createAudioPlayer();
        connection.subscribe(player);

        queue = {
            connection: connection,
            player: player,
            songs: [],
            isPlaying: false,
        };
        serverQueues.set(guildId, queue);

        player.on(AudioPlayerStatus.Idle, () => {
            const currentQueue = serverQueues.get(guildId);
            if (currentQueue?.isPlaying) {
                logger.log('Song finished, playing next in queue.', guildId);
                currentQueue.songs.shift();
                playNextSong(guildId);
            }
        });
        player.on('error', err => logger.error(`Audio player error: ${err.message}`, guildId));
    }

    try {
        logger.log(`Searching for song with query: "${query}"`, guildId);
        const searchProcess = spawn('yt-dlp', [
            query,
            '--dump-json',
            '--no-playlist',
            '--quiet',
        ]);

        let jsonData = '';
        searchProcess.stdout.on('data', (data) => jsonData += data);

        let stderrOutput = '';
        searchProcess.stderr.on('data', (data) => stderrOutput += data);

        searchProcess.on('close', (code) => {
            if (code !== 0) {
                logger.error(`Search process exited with code ${code}. Stderr: ${stderrOutput}`, guildId);
                return message.reply("I couldn't find a video for that query.");
            }

            try {
                const videoInfo = JSON.parse(jsonData);
                const song: Song = {
                    title: videoInfo.title,
                    url: videoInfo.webpage_url,
                    duration: new Date(videoInfo.duration * 1000).toISOString().slice(11, 19),
                    requestedBy: message.author.tag,
                };

                const currentQueue = serverQueues.get(guildId);
                if (currentQueue) {
                    currentQueue.songs.push(song);
                    logger.log(`Added to queue: "${song.title}"`, guildId);
                    message.reply(`✅ Added **${song.title}** to the queue!`);

                    if (!currentQueue.isPlaying) {
                        playNextSong(guildId);
                    }
                }
            } catch (e) {
                logger.error(`Error parsing yt-dlp JSON: ${e}`, guildId);
                message.reply("I found the video, but couldn't process its details.");
            }
        });
    } catch (err) {
        logger.error(`An error occurred while trying to get the video: ${err}`, guildId);
        message.reply('An error occurred while trying to get the video.');
    }
}


client.on('messageCreate', async (message: Message) => {
    if (message.author.bot || !message.guild) return;

    // A simple prefix checker. For slash commands, this logic would be different.
    const prefix = "/";
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift()?.toLowerCase();

    const guildId = message.guild.id;

    if (!command) return;

    logger.log(`Command received: ${command} with args: [${args.join(', ')}]`, guildId);

    // Using a switch for cleaner command handling
    switch (command) {
        case 'musikbot':
            const subCommand = args[0];
            if (subCommand === 'help') {
                const helpEmbed = new EmbedBuilder()
                    .setColor('#0099ff')
                    .setTitle('Musikbot Help')
                    .setDescription('Here is a list of all my commands and how to use them:')
                    .addFields(
                        { name: '`/play <URL>` or `/p <URL>`', value: 'Plays a song directly from a YouTube or SoundCloud URL.' },
                        { name: '`/search <song name>`', value: 'Searches YouTube for a song and adds it to the queue.' },
                        { name: '`/skip`', value: 'Skips the currently playing song.' },
                        { name: '`/queue`', value: 'Displays the current music queue.' },
                        { name: '`/stop`', value: 'Stops the music, clears the queue, and disconnects the bot.' },
                        { name: '`/musikbot about`', value: 'Shows information about the bot and its creator.' }
                    )
                    .setFooter({ text: 'Enjoy the music!' });
                if (message.channel.isTextBased()) {
                    if (message.channel.type === ChannelType.GuildText) {
                        message.channel.send({ embeds: [helpEmbed] });
                    }
                }
            } else if (subCommand === 'about') {
                const aboutEmbed = new EmbedBuilder()
                    .setColor('#facc15')
                    .setTitle('About Musikbot')
                    .setAuthor({
                        name: 'Cajan',
                        iconURL: 'https://avatars.githubusercontent.com/u/3718372?v=4',
                        url: 'https://github.com/totte94'
                    })
                    .setDescription('This is a passion project to build a fully functional music bot in Discord using TypeScript and Node.js.')
                    .addFields(
                        { name: 'Version', value: '1.0.1', inline: true }, // Incremented version
                        { name: 'Creator', value: 'Cajan', inline: true },
                        { name: 'GitHub Repo', value: '[Click here](https://github.com/totte94/Cajans-musikbot)' }
                    )
                    .setImage('https://upload.wikimedia.org/wikipedia/en/thumb/4/4c/Flag_of_Sweden.svg/1200px-Flag_of_Sweden.svg.png')
                    .setTimestamp()
                    .setFooter({ text: 'Thanks for using the bot!', iconURL: client.user?.displayAvatarURL() });

                if (message.channel.isTextBased()) {
                    if (message.channel.type === ChannelType.GuildText) {
                        message.channel.send({ embeds: [aboutEmbed] });
                    }
                }
            }
            break;

        case 'play':
        case 'p':
            const urlQuery = args[0];
            if (!urlQuery) return message.reply('Please provide a URL to play!');
            if (!urlQuery.startsWith('http')) {
                return message.reply('The `/play` command is for direct URLs only. For searching, please use `/search <song name>`.');
            }
            enqueueSong(urlQuery, message);
            break;

        case 'search':
            const searchQuery = args.join(' ');
            if (!searchQuery) return message.reply('Please provide a song name to search for!');
            const ytSearchQuery = `ytsearch1:"${searchQuery}"`;
            enqueueSong(ytSearchQuery, message);
            break;

        case 'skip':
            const skipQueue = serverQueues.get(guildId);
            if (!skipQueue || !skipQueue.isPlaying) {
                return message.reply('There is no song currently playing to skip!');
            }
            logger.log('Skipping current song.', guildId);
            skipQueue.player.stop(true); // This will trigger the 'idle' event and play the next song.
            message.reply('⏭️ Skipped!');
            break;

        case 'queue':
            const qQueue = serverQueues.get(guildId);
            if (!qQueue || qQueue.songs.length === 0) {
                return message.reply('The queue is currently empty!');
            }
            const [currentlyPlaying, ...upcomingSongsList] = qQueue.songs;
            const upcomingSongs = upcomingSongsList.slice(0, 10).map((song, index) => {
                return `**${index + 1}.** ${song.title} (${song.duration})`;
            }).join('\n');
            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('Music Queue')
                .addFields(
                    { name: '🎶 Now Playing', value: `${currentlyPlaying.title} (${currentlyPlaying.duration})` },
                    { name: '📜 Up Next', value: upcomingSongs.length > 0 ? upcomingSongs : 'No more songs in the queue.' }
                )
                .setFooter({ text: `There are ${qQueue.songs.length} songs in total.` });

            if (message.channel.isTextBased()) {
                if (message.channel.type === ChannelType.GuildText) {
                    message.channel.send({ embeds: [embed] });
                }
            }
            break;

        case 'stop':
            const stopQueue = serverQueues.get(guildId);
            if (!stopQueue) return message.reply('Nothing to stop!');
            logger.log('Stopping playback and clearing queue.', guildId);
            stopQueue.songs = [];
            if (stopQueue.process) stopQueue.process.kill();
            stopQueue.player.stop(true);
            stopQueue.connection.destroy();
            serverQueues.delete(guildId);
            message.reply('⏹️ Playback stopped and queue cleared!');
            break;
    }
});

client.login(process.env.DISCORD_TOKEN);
