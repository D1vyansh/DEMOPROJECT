#!/usr/bin/env node

const { Command } = require('commander');
const { login, listSecrets, createSecret, logout } = require('./cliCommands');
const program = new Command();

program.version('1.0.0');

// Login Command
program.command('login')
  .description('Login to the system via GitHub OAuth')
  .action(login);

// Logout Command
program.command('logout')
  .description('Logout from the system')
  .action(logout);

// List Secrets Command
program.command('secrets')
  .description('List all secrets visible to you')
  .action(listSecrets);

// Create Secret Command
program.command('create-secret')
  .description('Create a new secret')
  .option('-k, --key <key>', 'Key for the secret')
  .option('-v, --value <value>', 'Value for the secret')
  .action(createSecret);

program.parse(process.argv);
