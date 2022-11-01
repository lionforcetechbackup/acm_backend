module.exports = (sequelize, DataTypes) => {
  const client_admin_activities = sequelize.define("client_admin_activities", {
    code: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    type: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "type is empty",
        },
      },
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "name is empty",
        },
      },
    },
    response_frequency: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    submission_day: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    organization_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    organization_type: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    type_of_measure: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    aggregation_type: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    kpi: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    kpi_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    observation_name: {
      type: DataTypes.STRING(255),
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
    document_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    document_link: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    expiry_days: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    element_dummy: {
      type: DataTypes.STRING(5000),
      allowNull: true,
    },
    assign_dummy: {
      type: DataTypes.STRING(5000),
      allowNull: true,
    },
    createdby: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  });

  client_admin_activities.associate = (models) => {
    client_admin_activities.hasMany(models.storage_activity_checklist, {
      foreignKey: "client_activity_id",
      as: "storjoinchecklist",
    });
    client_admin_activities.hasMany(models.storage_activity_kpi, {
      foreignKey: "client_activity_id",
      as: "storejoin",
    });
    client_admin_activities.hasMany(models.storage_observation, {
      foreignKey: "client_activity_id",
      as: "storeobservationjoin",
    });

    client_admin_activities.hasMany(models.client_admin_datacollections, {
      foreignKey: "client_activity_id",
      as: "clientAdminDatacollections",
    });
  };
  return client_admin_activities;
};
