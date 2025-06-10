import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('about')
    .setDescription('Shows information about this bot.');

export async function execute(interaction: ChatInputCommandInteraction) {
    const aboutEmbed = new EmbedBuilder()
        .setColor('#facc15')
        .setTitle('About Musikbot')
        .setAuthor({
            name: 'Cajan',
            iconURL: 'https://avatars.githubusercontent.com/u/3718372?v=4',
            url: 'https://github.com/totte94'
        })
        .setDescription('A passion project to build a fully functional music bot in Discord using TypeScript and Node.js.')
        .addFields(
            { name: 'Version', value: '2.0.0 (Slash Commands)', inline: true },
            { name: 'Creator', value: 'Cajan', inline: true },
            { name: 'GitHub Repo', value: '[Click here](https://github.com/totte94/Cajans-musikbot)' }
        )
        .setImage('https://upload.wikimedia.org/wikipedia/en/thumb/4/4c/Flag_of_Sweden.svg/1200px-Flag_of_Sweden.svg.png')
        .setTimestamp()
        .setFooter({ text: 'Thanks for using the bot!', iconURL: interaction.client.user?.displayAvatarURL() });

    await interaction.reply({ embeds: [aboutEmbed] });
}