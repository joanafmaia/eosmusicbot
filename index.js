const { Client, GatewayIntentBits, Collection, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { Shoukaku, Connectors } = require('shoukaku');
const fs = require('fs');
const Genius = require('genius-lyrics');
const config = require('./config.json'); // token, guildId, voiceChannelId, playlistUrl, geniusToken

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });
client.commands = new Collection();

// Carregar comandos
const commandFiles = fs.readdirSync('./commands').filter(f => f.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
  if (command.aliases) command.aliases.forEach(alias => client.commands.set(alias, command));
}

// Genius client
const geniusClient = new Genius.Client(config.geniusToken);

// Configura o node do Lavalink (corrigido)
const nodes = [{
  name: 'MainNode',
  url: 'werturz.ddns.net:22333', // REMOVA O 'ws://'
  auth: 'youshallnotportuguese',
  secure: false
}];

const shoukaku = new Shoukaku(new Connectors.DiscordJS(client), nodes, {
  resume: { key: 'resumeKey', timeout: 60 },
  defaultSearchPlatform: 'youtube'
});

client.shoukaku = shoukaku;

// Eventos do Lavalink
shoukaku.on('ready', node => console.log(`Lavalink node ready: ${node.name}`));
shoukaku.on('error', (node, error) => console.error(`Node ${node.name} error:`, error));

// Bot pronto
client.on('clientReady', async () => {
  console.log(`${client.user.tag} online!`);

  const guild = client.guilds.cache.get(config.guildId);
  if (!guild) return console.error('Guild não encontrada!');

  const channel = guild.channels.cache.get(config.voiceChannelId);
  if (!channel) return console.error('Canal de voz não encontrado!');

  try {
    const player = await shoukaku.joinVoiceChannel({
      guildId: guild.id,
      channelId: channel.id,
      deaf: true
    });

    async function loadPlaylist() {
      const results = await player.node.rest.loadTracks(config.playlistUrl);
      player.queue.add(results.tracks);
      if (!player.playing) player.play();
    }

    await loadPlaylist();

    // Loop 24/7
    player.on('trackEnd', async () => {
      if (!player.queue.length) await loadPlaylist();
      if (!player.playing && player.queue.length) player.play();
    });

    // Now Playing embed
    player.on('trackStart', track => {
      const embed = new EmbedBuilder()
        .setTitle('🎶 Tocando agora')
        .setDescription(track.info.title)
        .setThumbnail(track.info.thumbnail)
        .setColor('Random');
      channel.send({ embeds: [embed] });
    });

  } catch (err) {
    console.error('Erro ao criar player/conectar canal de voz:', err);
  }
});

// Menu interativo ao entrar no canal
client.on('voiceStateUpdate', (oldState, newState) => {
  const channel = client.channels.cache.get(config.voiceChannelId);
  if (newState.channelId === channel.id && oldState.channelId !== channel.id) {
    const row = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('quick-menu')
        .setPlaceholder('Escolha uma opção')
        .addOptions([
          { label: 'Search', value: 'search' },
          { label: 'Play URL', value: 'playurl' },
          { label: 'Queue', value: 'queue' },
          { label: 'Skip', value: 'skip' }
        ])
    );
    channel.send({ content: `👋 Olá ${newState.member}, escolha uma ação:`, components: [row] });
  }
});

// Comandos e interações
client.on('interactionCreate', async interaction => {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try { await command.execute(interaction, client); }
    catch (err) { console.error(err); interaction.reply({ content: 'Erro ao executar comando', ephemeral: true }); }
  }

  if (interaction.isStringSelectMenu()) {
    const player = shoukaku.getPlayer(interaction.guildId);
    if (!player) return;

    if (interaction.customId === 'quick-menu') {
      switch(interaction.values[0]) {
        case 'search': interaction.reply('Digite o nome da música com `/search [nome]`'); break;
        case 'playurl': interaction.reply('Cole a URL da música com `/play [URL]`'); break;
        case 'queue':
          const queue = player.queue.map((t, i) => `${i+1}. ${t.info.title}`).join('\n');
          interaction.reply({ content: `🎶 Fila atual:\n${queue || 'Fila vazia'}`, ephemeral: true });
          break;
        case 'skip': player.stop(); interaction.reply('⏭ Música pulada!'); break;
      }
    }

    // Menu de seleção de track (do /search)
    if (interaction.customId === 'select-track') {
      const index = parseInt(interaction.values[0]);
      const results = await player.node.rest.loadTracks(`ytsearch:${interaction.message.content.replace('Escolha uma música:', '')}`);
      if (!results.tracks[index]) return interaction.reply('Erro ao escolher a música.');
      player.queue.add(results.tracks[index]);
      if (!player.playing) player.play();
      interaction.update({ content: `🎶 Música adicionada à fila: ${results.tracks[index].info.title}`, components: [] });
    }
  }

  // /lyrics
  if (interaction.isChatInputCommand() && interaction.commandName === 'lyrics') {
    const player = shoukaku.getPlayer(interaction.guildId);
    if (!player || !player.current) return interaction.reply('Nenhuma música tocando no momento.');

    const songTitle = player.current.info.title;
    try {
      const searches = await geniusClient.songs.search(songTitle);
      if (!searches.length) return interaction.reply('Letra não encontrada.');

      const lyrics = await searches[0].lyrics();
      const embed = new EmbedBuilder()
        .setTitle(`🎵 Letra: ${songTitle}`)
        .setDescription(lyrics.length > 4096 ? lyrics.slice(0, 4090) + '...' : lyrics)
        .setColor('Random');

      interaction.reply({ embeds: [embed] });

    } catch (err) {
      console.error(err);
      interaction.reply('Erro ao buscar a letra.');
    }
  }
});

// Catch de erros
process.on('unhandledRejection', err => console.error('Unhandled Rejection:', err));

client.login(config.token);
