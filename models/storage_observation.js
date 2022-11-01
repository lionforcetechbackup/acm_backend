module.exports = (sequelize, DataTypes) => {
  const storage_observation = sequelize.define("storage_observation", {
    mapping_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    organization_id: {
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
    },
    client_activity_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    observation_type: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    currency_type: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    currency: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    comments: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    expiry_date: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    responsedate: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "response_date is empty",
        },
      },
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    frequency: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
  });
  storage_observation.associate = (models) => {
    storage_observation.belongsTo(models.users, {
      foreignKey: "updator_id",
      as: "userDetail",
    });
    storage_observation.belongsTo(models.admin_activities, {
      foreignKey: "admin_activity_id",
      as: "adminActivityDetail",
    });
    storage_observation.belongsTo(models.client_admin_activities, {
      foreignKey: "client_activity_id",
      as: "clientActivityDetail",
    });
    storage_observation.belongsTo(models.organizations, {
      foreignKey: "organization_id",
      as: "organizationScoreJoin",
    });
  };
  return storage_observation;
};
