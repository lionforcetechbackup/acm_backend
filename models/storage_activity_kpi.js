module.exports = (sequelize, DataTypes) => {
  const storage_activity_kpi = sequelize.define('storage_activity_kpi', {
    client_activity_id: {
      type: DataTypes.INTEGER,
      allowNull: true,

    },mapping_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    updator_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    admin_activity_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },organization_id:{
      type: DataTypes.INTEGER,
      allowNull: true,
    }, aggregation_type: {
      type: DataTypes.STRING(255),
      allowNull: true,

    }, type_of_measure: {
      type: DataTypes.STRING(255),
      allowNull: true,

    }, status: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  });
  storage_activity_kpi.associate = models => {
    storage_activity_kpi.belongsTo(models.users, { foreignKey: 'updator_id', as: 'userDetail' });
    storage_activity_kpi.belongsTo(models.admin_activities, { foreignKey: 'admin_activity_id', as: 'adminActivityDetail' });
    storage_activity_kpi.belongsTo(models.client_admin_activities, { foreignKey: 'client_activity_id', as: 'clientActivityDetail' });
    storage_activity_kpi.hasMany(models.storage_activity_kpi_elements, {as : 'element', foreignKey : 'storage_id'});
    storage_activity_kpi.belongsTo(models.organizations, { foreignKey: 'organization_id', as: 'organizationScoreJoin' });
  
  }
  return storage_activity_kpi;
}