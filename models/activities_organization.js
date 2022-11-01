module.exports = (sequelize, DataTypes) => {
  const activities_organization = sequelize.define(
    "activities_organization",
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
      admin_activity_id: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      client_admin_activity: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      activity_type: {
        type: DataTypes.INTEGER,
        allowNull: false,
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
      organization_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      organization_type: {
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
  activities_organization.associate = (models) => {
    // activities_organization.belongsTo(models.activity_mapping, { foreignKey: 'library_id', as: 'libraries_mapping' });
    // activities_organization.hasMany(models.activity_mapping, { foreignKey: 'admin_activity_id' });
    activities_organization.hasMany(models.storage_activity_checklist, {
      foreignKey: "admin_activity_id",
      as: "storjoinchecklist",
    });
  };
  return activities_organization;
};
