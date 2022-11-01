module.exports = (sequelize, DataTypes) => {
  const client_roles = sequelize.define('client_roles', {
    
    organization_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    role_id: {
      type: DataTypes.INTEGER,
      allowNull: true,

    }, user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,

    }, status: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },{freezeTableName: true});
  client_roles.associate = models => {
    client_roles.belongsTo(models.roles, { foreignKey: 'role_id', as: 'roles' });
    // client_roles.belongsTo(models.roles, { targetKey:'role_id',foreignKey: 'role_id' });
  }
  return client_roles;
}