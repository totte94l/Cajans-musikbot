import { ChatInputCommandInteraction } from 'discord.js';
import {
    VoiceConnection, AudioPlayer,
} from '@discordjs/voice';
import { ChildProcess } from 'child_process';

export interface Song {
    title: string;
    url: string;
    duration: string;
    requestedBy: string;
}

export interface GuildQueue {
    connection: VoiceConnection;
    player: AudioPlayer;
    process?: ChildProcess;
    songs: Song[];
    isPlaying: boolean;
    lastInteraction: ChatInputCommandInteraction | null;
}