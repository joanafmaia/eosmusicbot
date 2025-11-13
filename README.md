# EOSMusicBot 🎵

A 24/7 music bot for Discord inspired by FredBot. Supports YouTube, Spotify, SoundCloud, playlists, and includes search, play, queue, skip commands, and lyrics using Genius.

---

## Features

- 🎶 Plays music from YouTube, Spotify, SoundCloud, and direct URLs
- 🔁 24/7 playlist loop
- 📝 `/search` command with a track selection menu
- ⏭ `/skip` to skip the current track
- 📄 `/queue` to view the current queue
- 🎵 `/lyrics` to get lyrics of the currently playing song (Genius)
- 👋 Interactive menu when users join the voice channel
- "Now Playing" embed with thumbnail and song title

---

## Requirements

- Node.js >= 18
- NPM >= 8
- Discord Bot Token
- Lavalink v4 hosted (e.g., `ws://host:port` with password)
- Genius API Token (optional, for `/lyrics`)

---

## Installation

1. Clone the repository:
git clone `https://github.com/your-username/eosmusicbot.git`
cd eosmusicbot

2. Install dependencies:

npm install discord.js @discordjs/voice shoukaku node-fetch genius-lyrics

3. Configure the config.json file (see example below).

4. Create a commands folder and add command files (play.js, search.js, skip.js, etc.).

5. Run the bot:
`node index.js`

## Configuration (config.json)
`{
  "token": "YOUR_BOT_TOKEN",
  "guildId": "YOUR_SERVER_ID",
  "voiceChannelId": "VOICE_CHANNEL_ID",
  "playlistUrl": "24_7_PLAYLIST_URL",
  "geniusToken": "YOUR_GENIUS_TOKEN"
}`

## Lavalink Node Configuration
Example node for Shoukaku:
`"lavalink": {
  "host": "YOUR_LAVALINK_HOST",
  "port": 2333,
  "password": "YOUR_LAVALINK_PASSWORD",
  "secure": false
}`


## Commands:
`/play` [URL or name] – Plays a song or adds it to the queue
`/search` [name] – Searches for songs and shows selectable options
`/skip` – Skips the currently playing track
`/queue` – Shows the queue
`/lyrics` – Displays lyrics of the currently playing track
