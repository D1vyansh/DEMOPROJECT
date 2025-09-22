const axios = require('axios');
// const open = require('open');
const openModule = require('open');
const open = openModule.default || openModule;
const { execSync } = require('child_process');
const { writeFileSync, readFileSync, existsSync, unlinkSync } = require('fs');

const API_URL = 'http://localhost:3000'; // Update if different

let session = {};
const sessionFile = './session.json';

if (existsSync(sessionFile)) {
  try {
    session = JSON.parse(readFileSync(sessionFile, 'utf8'));
  } catch (e) {
    console.error('Failed to read session.json:', e);
  }
}


async function login() {
  console.log('🔐 Logging in via GitHub...');

  const cliLoginUrl = `${API_URL}/auth/github?cli=true`;
  open(cliLoginUrl);

  console.log('\nPlease complete login in the browser.');
  const tokenInput = require('readline-sync').question('Paste the CLI token shown in browser: ');

  try {
    const response = await axios.get(`${API_URL}/cli-token/${tokenInput}`);
    const { token, userId, organizationId, username } = response.data;

    session = { token, userId, organizationId, username };
    writeFileSync('./session.json', JSON.stringify(session, null, 2));

    console.log(`✅ Logged in as ${username}`);
  } catch (error) {
    console.error('❌ Failed to fetch user session:', error.message);
  }
}




async function logout() {
  session = null;
  if (existsSync(sessionFile)) {
    unlinkSync(sessionFile);
  }
  console.log('✅ Logged out and session cleared.');
}

async function listSecrets() {
  if (!session || !session.token) {
    console.log('❌ You must be logged in to view secrets.');
    return;
  }

  try {
    const response = await axios.get(`${API_URL}/secrets`, {
      headers: { Authorization: `Bearer ${session.token}` },
    });

    if (response.data.length === 0) {
      console.log('📭 No secrets found.');
    } else {
      console.log('🔐 Secrets:');
      response.data.forEach((secret, index) => {
        console.log(`${index + 1}. ${secret.key}: ${secret.value}`);
      });
    }
  } catch (error) {
    console.error('❌ Error fetching secrets:', error.message);
  }
}

async function createSecret(cmd) {
  if (!session || !session.token) {
    console.log('❌ You must be logged in to create secrets.');
    return;
  }

  const { key, value } = cmd;

  if (!key || !value) {
    console.log('❌ Both key and value are required to create a secret.');
    return;
  }

  try {
    const response = await axios.post(`${API_URL}/secrets`, {
      key,
      value,
    }, {
      headers: { Authorization: `Bearer ${session.token}` },
    });

    console.log('✅ Secret created successfully:', response.data);
  } catch (error) {
    console.error('❌ Error creating secret:', error.message);
  }
}

// ✅ Export all commands so they can be used in cli.js
module.exports = {
  login,
  logout,
  listSecrets,
  createSecret
};

