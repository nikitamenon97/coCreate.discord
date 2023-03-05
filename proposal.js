const Discord = require("discord.js");
const { ActionRowBuilder, StringSelectMenuBuilder, PermissionFlagsBits, ButtonBuilder, ButtonStyle, Client, Events, GatewayIntentBits, InteractionType,ModalBuilder,TextInputBuilder,TextInputStyle,} = require('discord.js');
const config = require("./config.json");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const client = require('./client.js');

let prefix = "/";
let proj_id = "";

client.on(Discord.Events.MessageCreate, async (message) => { 
        if (message.author.bot) return;
        if (!message.content.startsWith(prefix)) return;
        
        const commandBody = message.content.slice(prefix.length);
        const args = commandBody.split(' ');
        const command = args.shift().toLowerCase();

        if (command === "create_proposal" || command === "create_task") {

          const get_all_projects = await fetch(`${config.CoCreate_BASE_URL}/api/entities/${config.ENTITY_ID}/projects`)
          .then(response => response.json()); 

          // console.log("project[0]:", get_all_projects);
          const dropdown_options_list = []

          get_all_projects.data.slice(0,20).forEach(project => {
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

          if (command === "create_proposal"){
          // console.log("------", dropdown_options_list)
          view_project_dropdown.addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('view-project-dropdown-for-proposal')
                .setPlaceholder('Nothing selected')
                .addOptions(dropdown_options_list)
          );

          message.reply({
            content: "The projects currently running are:", components: [view_project_dropdown],
            });
        }

        if (command === "create_task"){
          view_project_dropdown.addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('view-project-dropdown-for-task')
                .setPlaceholder('Nothing selected')
                .addOptions(dropdown_options_list)
          );

            message.reply({
              content: "The projects currently running are:", components: [view_project_dropdown],
              });
        }
        
      }
    }
)

client.on(Events.InteractionCreate, async (interaction) => {
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

    if (interaction.isButton()) {
      if (interaction.customId === 'proposal-button') {
        const create_proposal_modal = new ModalBuilder()
          .setCustomId('proposal-modal')
          .setTitle('Submit your proposal')
          .addComponents([
            new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('proposal-title')
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
              .setCustomId('proposal-description')
              .setLabel('Description')
              .setStyle(TextInputStyle.Paragraph)
              .setMinLength(4)
              .setMaxLength(100)
              .setPlaceholder('')
              .setRequired(true)
            )
            ]);

        await interaction.showModal(create_proposal_modal);
      }
      if (interaction.customId === 'task-button'){
        const create_task_modal = new ModalBuilder()
        .setCustomId('task-modal')
        .setTitle('Submit your task')
        .addComponents([
          new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('task-title')
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
            .setCustomId('task-description')
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
            .setCustomId('task-eta')
            .setLabel('Estimated date of completion')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('')
            .setRequired(true)
          )
          ])
        .addComponents([
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
            .setCustomId('task-CP')
            .setLabel('Estimated CP')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('')
            .setRequired(true)
          )
          ]);

      await interaction.showModal(create_task_modal);
      }
    }
  
    if (interaction.type === InteractionType.ModalSubmit) {
      if (interaction.customId === 'proposal-modal') {
 
        // get entity ID from discord username
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
        console.log("coCreate user id:", coCreate_userid.data);

        console.log(JSON.stringify({"title": interaction.fields.getTextInputValue('proposal-title'),
        "description": interaction.fields.getTextInputValue('proposal-description'),
        "authors": [coCreate_userid.data],
        "expiresAt": Date.now()+ (7 * 24 * 60 * 60 * 1000)}))

        console.log(`${config.CoCreate_BASE_URL}/api/entities/${config.ENTITY_ID}/projects/${proj_id}/proposals`)


        const api_result = await fetch(`${config.CoCreate_BASE_URL}/api/entities/${config.ENTITY_ID}/projects/${proj_id}/proposals`,
            {
                method: "POST",
                mode: "cors", 
                cache: "no-cache",
                headers: {
                    "Content-Type": "application/json"
                  },
                body: JSON.stringify({"title": interaction.fields.getTextInputValue('proposal-title'),
                                      "description": interaction.fields.getTextInputValue('proposal-description'),
                                      "authors": [coCreate_userid.data],
                                      "expiresAt": Date.now()+ (7 * 24 * 60 * 60 * 1000)})
            })
              .then(response => response.json()); 
            console.log("response from api:", api_result);
        await interaction.reply({ content: 'Your proposal was submitted successfully!' });
      }
      if (interaction.customId === 'task-modal') {
        const api_result = await fetch(`${config.CoCreate_BASE_URL}/api/entities/${config.ENTITY_ID}/projects/${proj_id}/proposals/${proposal_id}/tasks`,
        {
            method: "POST",
            mode: "cors", 
            cache: "no-cache",
            headers: {
                "Content-Type": "application/json"
              },
            body: JSON.stringify({"title": interaction.fields.getTextInputValue('task-title'),
                                  "description": interaction.fields.getTextInputValue('task-description'),
                                  "eta": interaction.fields.getTextInputValue('task-eta'),
                                  "minXP": interaction.fields.getTextInputValue('task-CP'),
                                  "assignee": coCreate_userid.data,
                                  "userId": coCreate_userid.data
        })})
        .then(response => response.json()); 
        console.log("response from api:", api_result);
        await interaction.reply({ content: 'Your task was received successfully!' });
      }
    }

    if (interaction.isStringSelectMenu()){
      let proposal_trigger_button = new ActionRowBuilder();
      proposal_trigger_button.addComponents(
          new ButtonBuilder()
          .setCustomId('proposal-button')
          .setStyle(ButtonStyle.Primary)
          .setLabel('Submit Proposal'),
      );
      let task_trigger_button = new ActionRowBuilder();
      task_trigger_button.addComponents(
          new ButtonBuilder()
          .setCustomId('task-button')
          .setStyle(ButtonStyle.Primary)
          .setLabel('Submit Task'),
      );

      if (interaction.customId == 'view-project-dropdown-for-proposal'){
        proj_id = interaction.values[0];
        console.log("@@@@ inside dropdown interaction.values[0]", interaction.values[0]);

        await interaction.reply({
              components: [proposal_trigger_button],
          });
      }
      if (interaction.customId == 'view-project-dropdown-for-task'){
        proj_id = interaction.values[0];
        console.log("!!!! inside dropdown interaction.values[0]", interaction.values[0]);

        const get_all_proposals = await fetch(`${config.CoCreate_BASE_URL}/api/entities/${config.ENTITY_ID}/projects/${proj_id}/proposals`,
        {
            method: "GET",
            mode: "cors", 
            cache: "no-cache",
            headers: {
                "Content-Type": "application/json"
              }
        })
        .then(response => response.json()); 

        let proposal_options_list = [];
        get_all_proposals.data.forEach(proposal => {
          {
            proposal_options_list.push(
                  {
                      label: proposal.title,
                      description: proposal.description,
                      value: proposal.proposalId,
                  }
              )
          }
          });

        let view_proposals_dropdown = new ActionRowBuilder();
        view_proposals_dropdown.addComponents(
          new StringSelectMenuBuilder()
              .setCustomId('view-proposals-dropdown')
              .setPlaceholder('Nothing selected')
              .addOptions(proposal_options_list)
        );
        
        await interaction.reply({
          content: "The proposals currently running are:", components: [view_proposals_dropdown],
          });
      }
      if (interaction.customId == 'view-proposals-dropdown'){
        proposal_id = interaction.values[0];
        console.log("proposal ID interaction.values[0]", interaction.values[0]);
      
        await interaction.reply({
              components: [task_trigger_button],
          });
      }
    }
});
