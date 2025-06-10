
# Cajan's Musikbot 🎵

  

A modern, self-hosted Discord music bot built with Node.js and TypeScript. It uses slash commands and streams high-quality audio from YouTube and other sources directly into your voice channel.

This project has been fully refactored to use the latest `discord.js` v14 features, including a modular command handler for a clean and developer-friendly experience.

## Features

-  **Modern Slash Commands:** Easy and intuitive to use.

-  **High-Quality Audio:** Uses `yt-dlp` for the best possible audio streaming.

-  **Queue System:** Add multiple songs and see what's coming up next.

-  **Built with TypeScript:** Type-safe and maintainable code.

-  **Modular Command Handler:** Easily add or edit commands.

### Commands

-  `/play <url>`: Plays a song from a YouTube or SoundCloud URL.

-  `/search <query>`: Searches YouTube for a song and adds it to the queue.

-  `/skip`: Skips the currently playing song.

-  `/queue`: Displays the current music queue.

-  `/stop`: Stops playback, clears the queue, and disconnects the bot.

-  `/help`: Shows a list of all available commands.

-  `/about`: Shows information about the bot.

----------


## 🚀 Quick Start (Production Hosting)

This guide is for users who want to run the bot on a server using Docker for a simple and stable setup.


1.  **Clone the Repository:**

Bash
```
git clone https://github.com/totte94/Cajans-musikbot.git
cd Cajans-musikbot
```

2.  **Create and Configure `.env` File:** Create a `.env` file and fill it with your bot's token and IDs. See the **"Configuration Guide"** section below for detailed instructions on how to get these values.

3.  **Build and Run with Docker:**

Bash

```
# This command builds the image and starts the container in the background.
docker-compose up --build -d
```

Your bot is now online! To manage the container, use `docker-compose down` to stop it or `docker-compose logs -f` to view logs.

----------  

## 👨‍💻 Developer Guide

This guide is for those who want to modify the bot's code, add new commands, or understand its architecture.

### Prerequisites
- [Node.js](https://nodejs.org/en/) (v16.9.0 or higher)
- [pnpm](https://pnpm.io/installation) (or npm/yarn)
- [Git](https://git-scm.com/downloads)

### Project Structure

  

The project is organized into logical modules to keep the code clean and maintainable.

  

-  `src/`

-  `commands/`: Contains all individual command files. Each file exports a `data` (the command definition) and `execute` (the command logic) property.

-  `app.ts`: The main application entry point. It sets up the Discord client, loads all commands from the `commands` folder, and listens for interactions.

-  `player.ts`: The core music logic. It manages the server queues, handles song playback with `@discordjs/voice`, and interfaces with `yt-dlp`.

-  `deploy-commands.ts`: A utility script to register your slash commands with Discord's API. You only run this when you add or modify a command's definition.

-  `types.ts`: Contains shared TypeScript interfaces used across the project, like `Song` and `GuildQueue`, ensuring type safety.

### Development Workflow
**1. Setup & Installation**
Clone the repository and install the dependencies.

Bash
```
git clone https://github.com/totte94/Cajans-musikbot.git
cd Cajans-musikbot
pnpm install
```


**2. Configuration (`.env` file)**

  

Create your `.env` file by copying the example.

  

Bash
```
cp .env.example .env
```

Now, fill in the three required values.

  

#### 🔑 Configuration Guide

  

>  **1. `DISCORD_TOKEN`**

>

>  >  **Warning:** Your Discord Token is a super-secret password. Never share it with anyone or post it online.

>

>  - Go to the [Discord Developer Portal](https://discord.com/developers/applications) and create a **"New Application"**.

>  - Navigate to the **"Bot"** tab, click **"Reset Token"**, and copy the token.

>

> ----------

>

>  **2. `CLIENT_ID` (Application ID)**

>

>  - In the Developer Portal, go to **"General Information"** and copy the **"Application ID"**.

>

> ----------

>

>  **3. `GUILD_ID` (Server ID)**

>

>  - In the Discord app, enable **Developer Mode** (User Settings -> Advanced).

>  - Right-click on your development server and click **"Copy Server ID"**.

  

**3. Invite the Bot**

  

Use the following URL, replacing `YOUR_CLIENT_ID` with your bot's ID, to invite it to your development server. This URL includes the necessary `applications.commands` scope.

  

`https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8&scope=bot%20applications.commands`

  

**4. How to Add a New Command**

  

- Create a new file in `src/commands/`, for example `ping.ts`.

- Use this template as a starting point:

  



  
Typescript
```
import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';

export const data = new SlashCommandBuilder()
	.setName('ping')
	.setDescription('Replies with Pong!');

export async function execute(interaction: ChatInputCommandInteraction) {
	await interaction.reply('Pong!');
}
```


**5. Running the Bot in Development**

  

Start the bot using the `dev` script, which uses `ts-node` to run your TypeScript code directly.

Bash
```
pnpm dev
```

  

Your bot will log in, and you can now test your new command in your server!
