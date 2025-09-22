# 🔐 Secrets CLI Manager Project

This project is a Secrets Management application that allows users to log in via GitHub OAuth, manage secrets securely per organization, and access those secrets through a CLI tool. A CLI tool to securely authenticate users via GitHub OAuth and manage secrets associated with an organization.

---

## 🚀 Features

- 🔐 GitHub OAuth login via browser  
- 🧑‍💻 CLI login with token-based session management  
- 🔒 Manage secrets scoped by user organization  
- 🛠️ Uses SQLite database with Sequelize ORM  
- 📦 Simple CLI commands to list and create secrets  

---

## 📦 Project Setup

1. **Clone the repo**

```
git clone https://github.com/your-username/secrets-cli.git
cd secrets-cli
npm install
```

2. **Set environment variables**

```
GITHUB_CLIENT_ID=Ov23ligitS3OxGAYXrrI
GITHUB_CLIENT_SECRET=d40ca844665907da89af88a4758cfb9ce08716e0
SESSION_SECRET=your_session_secret
```

3. **Running the Server**

```
node server.js
```


## CLI Usage

### Login via GitHub

```
node cli.js login
```

### List your secrets

```
node cli.js secrets

🔐 Secrets:
1. apiKey: 123456
2. dbPassword: supersecret
```

### Create a secret

```
node cli.js create-secret -k API_KEY -v 123456

✅ Secret created successfully: { key: 'Key', value: 'Value' }
```

## Usage

### Authentication Flow

* Open http://localhost:3000 in your browser.

* Click "Login with GitHub".

* After successful GitHub OAuth, you will be redirected to the dashboard or receive a CLI token if using CLI mode.

* For CLI login, copy the token shown in the browser and paste it in your CLI prompt.

* The CLI stores a temporary session using the token to make authenticated API requests.

## CLI Commands

* login: Authenticate via GitHub and get a CLI token.

* create-secret -k <key> -v <value>: Create a new secret.

* list-secrets: List secrets for your organization.

## Troubleshooting

* 401 Unauthorized: Check Bearer token validity and existence in cliLoginSessions.

* 404 Token not found: Confirm CLI token pasted matches the one received from the server.

* Module not found errors: Run npm install to install missing dependencies.

* Database errors: Check if migrations or sync are correctly applied.
