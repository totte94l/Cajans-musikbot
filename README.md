# Cajan's Musikbot 🎵

A simple, self-hosted Discord music bot built with Node.js, TypeScript, and Docker. It streams audio from YouTube and other sources directly into your voice channel.

## Features

  - **High-Quality Audio:** Uses `yt-dlp` and `ffmpeg` for the best possible audio quality.
  - **Easy to Host:** Packaged with Docker for a one-command setup.
  - **Simple Commands:**
      - `/play <url>` or `/p <url>`: Plays a song from a direct URL.
      - `/search <song name>`: Searches YouTube and adds the top result to the queue.
      - `/skip`: Skips the current song.
      - `/queue`: Shows the current song queue.
      - `/stop`: Stops playback, clears the queue, and disconnects the bot.
      - `/musikbot help`: Shows the help menu.
      - `/musikbot about`: Shows information about the bot.

-----

## 🚀 Getting Started

To get the bot running on your own machine or server, you only need Git and Docker installed.

### Prerequisites

  - [Git](https://git-scm.com/downloads)
  - [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine on Linux)

### Installation Guide

**Step 1: Clone the Repository**

First, clone this repository to your local machine.

```bash
git clone https://github.com/totte94/Cajans-musikbot.git
cd Cajans-musikbot
```

**Step 2: Create the Configuration File**

The bot needs your Discord token to log in. You must create a `.env` file to store this secret.

1.  Make a copy of the example file `.env.example` and name it `.env`.
2.  Open the new `.env` file and replace the placeholder with your actual Discord Bot Token.

You can create the file with this command:

```bash
# For Windows (Command Prompt)
copy .env.example .env

# For Linux/macOS/Git Bash
cp .env.example .env
```

Your `.env` file should look like this:

```
# Get your token from the Discord Developer Portal
APP_ID=APPID
DISCORD_TOKEN=SUPERSECRETDISCORDTOKEN
PUBLIC_KEY=MYVERYPUBLICKEY
```

**Important:** Never share this token or commit the `.env` file to GitHub. The `.gitignore` file is already set up to prevent this.

**Step 3: Build and Run the Bot**

This is the final step\! The easiest way to run the bot is with `docker-compose`.

```bash
# This command builds the image and starts the container in the background.
docker-compose up --build -d
```

Your bot should now be online and connected to Discord\!

-----

## 🤖 Bot Management

Here are some useful commands for managing your bot container.

  - **To stop the bot:**
    ```bash
    docker-compose down
    ```
  - **To view the bot's live logs:**
    ```bash
    docker-compose logs -f
    ```
  - **To update the bot after pulling new changes from GitHub:**
    Just run the build and run command again. It will rebuild the image with the new changes and restart the container.
    ```bash
    docker-compose up --build -d
    ```

## Project Structure

  - `Dockerfile`: The recipe for building the bot's Docker image.
  - `docker-compose.yml`: A simple script for managing the Docker container.
  - `.dockerignore`: A list of files to exclude from the Docker image to keep it small.
  - `src/`: Contains all the TypeScript source code for the bot.