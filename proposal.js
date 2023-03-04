const Discord = require("discord.js");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, Client, Events, GatewayIntentBits, InteractionType,ModalBuilder,TextInputBuilder,TextInputStyle,} = require('discord.js');
const config = require("./config.json");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const client = new Discord.Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
})

const prefix = "/"

client.on('ready', () => {
    console.log(`Logged in ${client.user.tag}`)
})

client.on(Discord.Events.MessageCreate, async function(message) { 
        if (message.author.bot) return;
        if (!message.content.startsWith(prefix)) return;
        
        const commandBody = message.content.slice(prefix.length);
        const args = commandBody.split(' ');
        const command = args.shift().toLowerCase();

        if (command === "create_proposal") {
            let proposal_trigger_button = new ActionRowBuilder();
            proposal_trigger_button.addComponents(
                new ButtonBuilder()
                .setCustomId('proposal-button')
                .setStyle(ButtonStyle.Primary)
                .setLabel('Submit Proposal'),
            );
            message.reply({
                components: [proposal_trigger_button],
            });
        }
    }
)

client.on(Events.InteractionCreate, async (interaction) => {
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

        const api_result = await fetch(`${config.CoCreate_BASE_URL}/api/entities/${config.ENTITY_ID}/projects/${config.PROJECT_ID}/proposals`,
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
        await interaction.reply({ content: 'Your submission was received successfully!' });
      }
    }
  });

client.login(config.BOT_TOKEN);