const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'database.sqlite',
});

const User = sequelize.define('User', {
  githubId: { type: DataTypes.STRING, unique: true },
  username: DataTypes.STRING,
  accessToken: DataTypes.STRING, // Store GitHub access token
});

const Team = sequelize.define('Team', {
  name: DataTypes.STRING,
});

const Organization = sequelize.define('Organization', {
  name: DataTypes.STRING,
});

const Secret = sequelize.define('Secret', {
  key: DataTypes.STRING,
  value: DataTypes.STRING,
});

User.belongsTo(Organization);
Organization.hasMany(User);

User.belongsToMany(Team, { through: 'UserTeams' });
Team.belongsToMany(User, { through: 'UserTeams' });

Secret.belongsTo(Organization);
Organization.hasMany(Secret);

Secret.belongsToMany(User, { through: 'UserSecretPermissions' });
Secret.belongsToMany(Team, { through: 'TeamSecretPermissions' });

module.exports = { sequelize, User, Team, Organization, Secret };