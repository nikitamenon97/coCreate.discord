const Discord = require("discord.js");
const { ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, Client, Events, GatewayIntentBits, InteractionType,ModalBuilder,TextInputBuilder,TextInputStyle,} = require('discord.js');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const config = require("./config.json");
const axios = require('axios');

const client = new Discord.Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
})

const prefix = "/";

client.on(Discord.Events.MessageCreate, async function(message) { 
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;
  
  const commandBody = message.content.slice(prefix.length);
  const args = commandBody.split(' ');
  const command = args.shift().toLowerCase();

  if (command === "view" || command == "join") {
      const get_all_projects = await fetch(`${config.CoCreate_BASE_URL}/api/entities/${config.ENTITY_ID}/projects`)
        .then(response => response.json()); 

        console.log("project[0]:", get_all_projects[0]);
        const dropdown_options_list = []
        get_all_projects.data.forEach(project => {
        {
			dropdown_options_list.push(
                {
                    label: project.title,
					description: project.description,
					value: project.projectId,
				}
            )
        }
        });

    //   console.log("dropdown options", dropdown_options_list)
      let view_project_dropdown = new ActionRowBuilder();
      view_project_dropdown.addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('project-dropdown')
            .setPlaceholder('Nothing selected')
            .addOptions(dropdown_options_list)
      );

        message.reply({
          content: "The projects currently running are:", components: [view_project_dropdown],
          });
          
    //   if (command == "join"){ 
    //     message.reply({
    //       content: "The projects currently running are:", components: [view_project_dropdown],
    //       });
    //     }

  }

  if (command === "create") {
    let create_project_button = new ActionRowBuilder();
    create_project_button.addComponents(
        new ButtonBuilder()
        .setCustomId('create-project-button')
        .setStyle(ButtonStyle.Primary)
        .setLabel('Submit Project'),
    );
    message.reply({
        components: [create_project_button],
    });
  }

}
)

client.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.isButton()) {
      if (interaction.customId === 'create-project-button') {
        const create_project_modal = new ModalBuilder()
          .setCustomId('create-project-modal')
          .setTitle('Submit your Project details')
          .addComponents([
            new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('project-title')
              .setLabel('Title')
              .setStyle(TextInputStyle.Short)
              .setMinLength(4)
              .setMaxLength(12)
              .setPlaceholder('')
              .setRequired(true)
            )
          ])
          .addComponents([
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
              .setCustomId('project-description')
              .setLabel('Description')
              .setStyle(TextInputStyle.Paragraph)
              .setMinLength(4)
              .setMaxLength(100)
              .setPlaceholder('')
              .setRequired(true)
            )
            ])
            .addComponents([
                new ActionRowBuilder().addComponents(
                  new TextInputBuilder()
                  .setCustomId('project-channel-name')
                  .setLabel('channel-name')
                  .setStyle(TextInputStyle.Short)
                  .setMinLength(4)
                  .setMaxLength(100)
                  .setPlaceholder('')
                  .setRequired(true)
                )
            ])
            .addComponents([
                new ActionRowBuilder().addComponents(
                  new TextInputBuilder()
                  .setCustomId('project-link')
                  .setLabel('Miro board link')
                  .setStyle(TextInputStyle.Short)
                  .setMinLength(4)
                  .setMaxLength(100)
                  .setPlaceholder('')
                  .setRequired(true)
                )
            ]);

        await interaction.showModal(create_project_modal);
      }
    }
  
    if (interaction.type === InteractionType.ModalSubmit) {
      if (interaction.customId === 'create-project-modal') {
 
        // get entity ID from discord username
        const encoded_discord_id = encodeURIComponent(interaction.user.username);
        console.log("encoded discordid", encoded_discord_id);
        const coCreate_userid = await fetch(`${config.CoCreate_BASE_URL}/api/entities/${config.ENTITY_ID}/users/discord/${encoded_discord_id}`,
        {
            method: "GET",
            mode: "cors", 
            cache: "no-cache",
            headers: {
                "Content-Type": "application/json"
              }
        })
          .then(response => response.json()); 
        console.log("coCreate user id:", coCreate_userid.data);

        const create_proj_api_result = await fetch(`${config.CoCreate_BASE_URL}/api/entities/${config.ENTITY_ID}/projects`,
            {
                method: "POST",
                mode: "cors", 
                cache: "no-cache",
                headers: {
                    "Content-Type": "application/json"
                  },
                body: JSON.stringify({"title": interaction.fields.getTextInputValue('project-title'),
                                      "description": interaction.fields.getTextInputValue('project-description'),
                                      "authors": [coCreate_userid.data],
                                      "links": [interaction.fields.getTextInputValue('project-link')],
                                      "expiresAt": Date.now()+ (7 * 24 * 60 * 60 * 1000),
                                      "discordChannelId": interaction.fields.getTextInputValue('project-channel-name')})
            })
              .then(response => response.json()); 
            
              console.log("response from api:", create_proj_api_result);
            const channel = await interaction.guild.channels.create({
                name: interaction.fields.getTextInputValue('project-channel-name'),
                type: Discord.ChannelType.GuildText,
                // parent: cat[0].ID,
                // your permission overwrites or other options here
            });

            console.log(channel);
        await interaction.reply({ content: 'Your submission was received successfully! Navigate to channel: ' + interaction.fields.getTextInputValue('project-channel-name') });
        // interaction.member.voice.setChannel(channel).catch(e => console.error(`Couldn't move the user. | ${e}`));
      }
    }

    // if (!interaction.isStringSelectMenu()) return;
	if (interaction.isStringSelectMenu()){
        // console.log("@@@@@@@@", interaction);

        const get_discord_channel = await fetch(`${config.CoCreate_BASE_URL}/api/entities/${config.ENTITY_ID}/projects/${interaction.values[0]}`)
        .then(response => response.json()); 

        await interaction.reply({content: `Navigate to the channel: ${get_discord_channel.data.project_data.discordChannelId}`});
    }
  });

client.login(config.BOT_TOKEN);