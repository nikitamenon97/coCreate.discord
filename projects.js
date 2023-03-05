const Discord = require("discord.js");
const { ActionRowBuilder, StringSelectMenuBuilder, PermissionFlagsBits, ButtonBuilder, ButtonStyle, Client, Events, GatewayIntentBits, InteractionType,ModalBuilder,TextInputBuilder,TextInputStyle,} = require('discord.js');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const config = require("./config.json");
const axios = require('axios');
const client = require('./client.js');

// FIX LATER
let proj_id = "";
const prefix = "/";

client.on(Discord.Events.MessageCreate, async (message) =>  { 
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;
  
  const commandBody = message.content.slice(prefix.length);
  const args = commandBody.split(' ');
  const command = args.shift().toLowerCase();

  if (command === "create_project") {
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

  if (command === "view_project") {
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

    let view_project_dropdown = new ActionRowBuilder();
    view_project_dropdown.addComponents(
      new StringSelectMenuBuilder()
          .setCustomId('view-project-dropdown')
          .setPlaceholder('Nothing selected')
          .addOptions(dropdown_options_list)
    );

      message.reply({
        content: "The projects currently running are:", components: [view_project_dropdown],
        });
  }

  if (command === "join_project") {
    const get_all_projects = await fetch(`${config.CoCreate_BASE_URL}/api/entities/${config.ENTITY_ID}/projects`)
      .then(response => response.json()); 

      const dropdown_options_list = []
      get_all_projects.data.forEach(project => {
      {
          if (project.expiresAt >= Date.now()){
            dropdown_options_list.push(
              {
                  label: project.title,
                  description: project.description,
                  value: project.projectId,
              }
          )
        }
      }
      });

    let join_project_dropdown = new ActionRowBuilder();
    join_project_dropdown.addComponents(
      new StringSelectMenuBuilder()
          .setCustomId('join-project-dropdown')
          .setPlaceholder('Nothing selected')
          .addOptions(dropdown_options_list)
    );

      message.reply({
        content: "The projects currently running are:", components: [join_project_dropdown],
        });
  }
});


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
        await interaction.deferReply()

        const channel = await interaction.guild.channels.create({
            name: interaction.fields.getTextInputValue('project-channel-name'),
            type: Discord.ChannelType.GuildText,
            permissionOverwrites: [
                {
                  id: interaction.guild.roles.everyone,
                  deny: [ PermissionFlagsBits.SendMessages],
                  allow: [PermissionFlagsBits.ViewChannel,]
                },
                {
                  id: interaction.user.id,
                  allow: [PermissionFlagsBits.ViewChannel],
                },
                {
                  id: client.user.id,
                  allow: [PermissionFlagsBits.ViewChannel],
                },
              ],
        });

        const webhook = await channel.createWebhook({'name': interaction.fields.getTextInputValue('project-channel-name')})
       
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
                                    "discordChannelId": channel.id,
                                    "discordChannelName": interaction.fields.getTextInputValue('project-channel-name'),
                                    "discordWebhookURL": webhook.url})
            })
        .then(response => response.json()); 

        await interaction.editReply({ content: 'Your submission was received successfully! Navigate to channel: ' + interaction.fields.getTextInputValue('project-channel-name') });
      }
    }

	if (interaction.isStringSelectMenu()){
        if (interaction.customId == 'view-project-dropdown'){
        const get_discord_channel = await fetch(`${config.CoCreate_BASE_URL}/api/entities/${config.ENTITY_ID}/projects/${interaction.values[0]}`)
        .then(response => response.json()); 

        await interaction.reply({content: `Navigate to the channel: ${get_discord_channel.data.project_data.discordChannelName}`});
        }
        
        if (interaction.customId == 'join-project-dropdown'){
            console.log("------ proj_id:", interaction.values[0]);
            proj_id = interaction.values[0];

            const roles_options_list = [];
            config.ROLES.forEach(role => {
            {
                roles_options_list.push(
                {
                    label: role,
                    description: role,
                    value: role,
                }
            )}});

            let join_role_dropdown = new ActionRowBuilder();
            join_role_dropdown.addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('join-role-dropdown')
                .setPlaceholder('Nothing selected')
                .addOptions(roles_options_list)
            );

            interaction.reply({
                content: "Which role would you like to join as:", components: [join_role_dropdown],
            });
        }

        if (interaction.customId == "join-role-dropdown"){
            const coCreate_userid = await fetch(`${config.CoCreate_BASE_URL}/api/entities/${config.ENTITY_ID}/users/discord/${interaction.user.username}`,
            {
                method: "GET",
                mode: "cors", 
                cache: "no-cache",
                headers: {
                    "Content-Type": "application/json"
                }
            })
            .then(response => response.json()); 

            const join_project_api = await fetch(`${config.CoCreate_BASE_URL}/api/entities/${config.ENTITY_ID}/projects/${proj_id}/join`,
            {
                method: "POST",
                mode: "cors", 
                cache: "no-cache",
                headers: {
                    "Content-Type": "application/json"
                    },
                body: JSON.stringify({"userId": coCreate_userid.data,
                                      "role": interaction.values[0],
                                     })
            })
            .then(response => response.json()); 

            const get_discord_channel = await fetch(`${config.CoCreate_BASE_URL}/api/entities/${config.ENTITY_ID}/projects/${proj_id}`)
            .then(response => response.json()); 
    
            await interaction.reply({content: `Joined project! Navigate to the channel: ${get_discord_channel.data.project_data.discordChannelName}`});
        }
    }
  });
