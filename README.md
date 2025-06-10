# Cajan's Musikbot 🎵

A modern, self-hosted Discord music bot built with Node.js and TypeScript. It uses slash commands and streams high-quality audio from YouTube and other sources directly into your voice channel.

This project has been fully refactored to use the latest `discord.js` v14 features, including a modular command handler for a clean and developer-friendly experience.

## Features

  - **Modern Slash Commands:** Easy and intuitive to use.
  - **High-Quality Audio:** Uses `yt-dlp` for the best possible audio streaming.
  - **Queue System:** Add multiple songs and see what's coming up next.
  - **Built with TypeScript:** Type-safe and maintainable code.
  - **Modular Command Handler:** Easily add or edit commands.

### Commands

  - `/play <url>`: Plays a song from a YouTube or SoundCloud URL.
  - `/search <query>`: Searches YouTube for a song and adds it to the queue.
  - `/skip`: Skips the currently playing song.
  - `/queue`: Displays the current music queue.
  - `/stop`: Stops playback, clears the queue, and disconnects the bot.
  - `/help`: Shows a list of all available commands.
  - `/about`: Shows information about the bot.

-----

## 🚀 Setup and Usage

This guide will walk you through the complete setup process.

### Step 1: Clone & Install Dependencies

First, clone this repository to your local machine, navigate into the directory, and install the necessary packages.

```bash
git clone https://github.com/totte94/Cajans-musikbot.git
cd Cajans-musikbot
pnpm install
```

### Step 2: Configure Your `.env` File

The bot requires secret keys to function. Create a `.env` file by copying the example file.

```bash
cp .env.example .env
```

Now, open the new `.env` file and fill in the values. See the detailed guide below on how to find your keys.

#### 🔑 Configuration Guide

> **1. `DISCORD_TOKEN`**
>
> > **Warning:** Your Discord Token is a super-secret password. Never share it with anyone or post it online.
>
>   - Go to the [Discord Developer Portal](https://discord.com/developers/applications) and create a **"New Application"**.
>   - Navigate to the **"Bot"** tab, click **"Reset Token"**, and copy the token.
>
> -----
>
> **2. `CLIENT_ID` (Application ID)**
>
>   - In the Developer Portal, go to **"General Information"** and copy the **"Application ID"**.
>   - 
>
> -----
>
> **3. `GUILD_ID` (Server ID for Development)**
>
>   - In the Discord app, enable **Developer Mode** (User Settings -\> Advanced).
>   - Right-click on your private development server and click **"Copy Server ID"**.
>   - This is used for instantly testing command updates. For a public deployment, you will comment this line out.

### Step 3: Invite the Bot to Your Server

Use the following URL, replacing `YOUR_CLIENT_ID` with the ID you just copied, to invite the bot to your server. This link includes the necessary permissions to create slash commands.

`https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8&scope=bot%20applications.commands`

### Step 4: Deploy Slash Commands (Mandatory First-Time Setup)

Before you can use the bot, you must register its slash commands with Discord. **This is a required step.**

The script will automatically deploy commands locally to your test server if `GUILD_ID` is set in `.env`, or globally if it is not.

  - **For Development:** Make sure `GUILD_ID` is set in your `.env` file. Commands will update instantly on this server.
  - **For Production/Public Use:** Comment out or remove the `GUILD_ID` line in `.env`. Commands will be deployed globally and can take up to an hour to appear on all servers.

Run the deployment script from your terminal:

```bash
pnpm deploy:commands
```

### Step 5: Run the Bot

Now you are ready to start the bot.

#### For Development

Run the bot in development mode using `ts-node`. It will automatically watch for code changes.

```bash
pnpm dev
```

#### For Production (Docker)

For a stable, 24/7 deployment, use Docker. This uses the compiled JavaScript version of your code for better performance.

```bash
docker-compose up --build -d
```

Your bot is now online and ready to use\!

-----

## ⚙️ Developer Workflow: When to Re-Deploy Commands

You **do not** need to run `pnpm deploy:commands` every time you change the code.

**You ONLY need to run `pnpm deploy:commands` when you change a command's *definition*, such as:**

  - Creating a new command file.
  - Deleting a command file.
  - Changing a command's `name` or `description`.
  - Adding, removing, or changing a command's `options`.

If you only change the logic *inside* a command's `execute` function (like fixing a bug or changing a reply message), you just need to **restart the bot** (`pnpm dev` or `docker-compose restart`).