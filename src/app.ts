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
    console.log('Bot is online!');

});


async function playNextSong(guildId: string) {
    const queue = serverQueues.get(guildId);
    if (!queue) return;

    if (queue.songs.length === 0) {
        queue.isPlaying = false;
        setTimeout(() => {
            const currentQueue = serverQueues.get(guildId);
            if (currentQueue && !currentQueue.isPlaying && currentQueue.songs.length === 0) {
                currentQueue.connection.destroy();
                serverQueues.delete(guildId);
                console.log(`Left channel in guild ${guildId} due to inactivity.`);
            }
        }, 120000); // 2 minutes
        return;
    }

    queue.isPlaying = true;
    const song = queue.songs[0];

    try {
        const ytDlpProcess = spawn('yt-dlp', [
            song.url,
            '-f', 'bestaudio[ext=opus]/bestaudio/best',
            '-o', '-',
        ]);
        queue.process = ytDlpProcess;

        const resource = createAudioResource(ytDlpProcess.stdout);
        queue.player.play(resource);

        ytDlpProcess.stderr.on('data', data => console.error(`[yt-dlp stderr for ${guildId}]: ${data}`));
        ytDlpProcess.on('error', error => console.error(`[yt-dlp error for ${guildId}]:`, error));

    } catch (error) {
        console.error(`Error playing song for guild ${guildId}:`, error);
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
                currentQueue.songs.shift();
                playNextSong(guildId);
            }
        });
        player.on('error', error => console.error(`[Player Error for ${guildId}]:`, error));
    }

    try {
        const searchProcess = spawn('yt-dlp', [
            query,
            '--dump-json',
            '--no-playlist'
        ]);

        let jsonData = '';
        searchProcess.stdout.on('data', (data) => jsonData += data);
        searchProcess.stderr.on('data', (data) => console.error(`[Search stderr]: ${data}`));

        searchProcess.on('close', (code) => {
            if (code !== 0) return message.reply('I couldn\'t find a video for that.');

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
                    message.reply(`✅ Added **${song.title}** to the queue!`);

                    if (!currentQueue.isPlaying) {
                        playNextSong(guildId);
                    }
                }
            } catch (e) {
                console.error("Error parsing yt-dlp JSON:", e);
                message.reply("I found the video, but couldn't process its details.");
            }
        });
    } catch (error) {
        console.error(error);
        message.reply('An error occurred while trying to get the video.');
    }
}


client.on('messageCreate', async (message: Message) => {
    if (message.author.bot || !message.guild) return;

    const command = message.content.toLowerCase().split(' ')[0];
    const args = message.content.split(' ').slice(1);
    const guildId = message.guild.id;

    if (command === '/musikbot') {
        switch (args[0]) {
            case 'help':
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
                return;
            case 'about':
                const aboutEmbed = new EmbedBuilder()
                    .setColor('#facc15')
                    .setTitle('Om Musikbot')
                    .setAuthor({
                        name: 'Cajan', //
                        iconURL: 'https://avatars.githubusercontent.com/u/3718372?v=4',
                        url: 'https://github.com/totte94'
                    })
                    .setDescription('Detta är ett passionsprojekt för att bygga en fullt fungerande musikbot i Discord med TypeScript och Node.js.')
                    .addFields(
                        { name: 'Version', value: '1.0.0', inline: true },
                        { name: 'Skapare', value: 'Cajan', inline: true },
                        { name: 'GitHub Repo', value: '[Klicka här](https://github.com/totte94l)' }
                    )
                    .setImage('https://upload.wikimedia.org/wikipedia/en/thumb/4/4c/Flag_of_Sweden.svg/1200px-Flag_of_Sweden.svg.png')
                    .setTimestamp()
                    .setFooter({ text: 'Tack för att du använder botten!', iconURL: client.user?.displayAvatarURL() });

                if (message.channel.isTextBased()) {
                    if (message.channel.type === ChannelType.GuildText) {
                        message.channel.send({ embeds: [aboutEmbed] });
                    }
                }
                return;
        }
    }

    if (command === '/play' || command === '/p') {
        const query = args[0];
        if (!query) return message.reply('Please provide a URL to play!');

        if (!query.startsWith('http')) {
            return message.reply('The `/play` command is for direct URLs only. For searching, please use `/search <song name>`.');
        }
        enqueueSong(query, message);
    }

    else if (command === '/search') {
        const query = args.join(' ');
        if (!query) return message.reply('Please provide a song name to search for!');
        const searchQuery = `ytsearch1:"${query}"`;
        enqueueSong(searchQuery, message);
    }

    else if (command === '/skip') {
        const queue = serverQueues.get(guildId);
        if (!queue || !queue.isPlaying) {
            return message.reply('There is no song currently playing to skip!');
        }
        message.reply('⏭️ Skipped!');
        queue.player.stop(true);
    }

    else if (command === '/queue') {
        const queue = serverQueues.get(guildId);
        if (!queue || queue.songs.length === 0) {
            return message.reply('The queue is currently empty!');
        }

        const currentlyPlaying = queue.songs[0];
        const upcomingSongs = queue.songs.slice(1, 11).map((song, index) => {
            return `**${index + 1}.** ${song.title} (${song.duration})`;
        }).join('\n');

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('Music Queue')
            .addFields(
                { name: '🎶 Now Playing', value: `${currentlyPlaying.title} (${currentlyPlaying.duration})` },
                { name: '📜 Up Next', value: upcomingSongs.length > 0 ? upcomingSongs : 'No more songs in the queue.' }
            )
            .setFooter({ text: `There are ${queue.songs.length} songs in total.` });

        if (message.channel.isTextBased()) {
            if (message.channel.type === ChannelType.GuildText) {
                message.channel.send({ embeds: [embed] });
            }
        }
    }

    else if (command === '/stop') {
        const queue = serverQueues.get(guildId);
        if (!queue) return message.reply('Nothing to stop!');
        queue.songs = [];
        if (queue.isPlaying) {
            queue.player.stop(true);
            if (queue.process) queue.process.kill();
        }
        if (queue.connection.state.status !== VoiceConnectionStatus.Destroyed) {
            queue.connection.destroy();
        }
        serverQueues.delete(guildId);
        message.reply('⏹️ Playback stopped and queue cleared!');
    }
});

client.login(process.env.DISCORD_TOKEN);