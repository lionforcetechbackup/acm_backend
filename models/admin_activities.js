module.exports = (sequelize, DataTypes) => {
  const admin_activities = sequelize.define(
    "admin_activities",
    {
      id: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        primaryKey: true,
        // unique: {
        //   args: true,
        //   msg: 'library already in use!'
        // }
      },
      code: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      description: {
        type: DataTypes.STRING(1500),
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "description is empty",
          },
        },
      },
      type: {
        type: DataTypes.STRING(255),
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
      kpi: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      kpi_name: {
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
      document_description: {
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
    },
    {
      indexes: [
        {
          unique: true,
          fields: ["code", "name", "type"],
        },
      ],
    }
  );
  admin_activities.associate = (models) => {
    // admin_activities.belongsTo(models.activity_mapping, { foreignKey: 'library_id', as: 'libraries_mapping' });
     admin_activities.hasOne(models.client_admin_datacollections, { foreignKey: 'admin_activity_id' });
    admin_activities.hasMany(models.storage_activity_checklist, {
      foreignKey: "admin_activity_id",
      as: "storjoinchecklist",
    });
  };
  return admin_activities;
};
