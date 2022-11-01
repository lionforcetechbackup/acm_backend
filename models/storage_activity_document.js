module.exports = (sequelize, DataTypes) => {
  const storage_activity_document = sequelize.define(
    "storage_activity_document",
    {
      organization_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      mapping_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      admin_activity_id: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      client_activity_id: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      updator_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "updator_id is empty",
          },
        },
      },
      document_link: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "document_link is empty",
          },
        },
      },
      comment: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      expiry_date: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      description: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      responsedate: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "responsedate is empty",
          },
        },
      },
      status: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    }
  );
  storage_activity_document.associate = (models) => {
    storage_activity_document.belongsTo(models.users, {
      foreignKey: "updator_id",
      as: "userDetail",
    });
    storage_activity_document.belongsTo(models.admin_activities, {
      foreignKey: "admin_activity_id",
      as: "adminActivityDetail",
    });
    storage_activity_document.belongsTo(models.client_admin_activities, {
      foreignKey: "client_activity_id",
      as: "clientActivityDetail",
    });
    storage_activity_document.belongsTo(models.organizations, {
      foreignKey: "organization_id",
      as: "organizationScoreJoin",
    });
  };
  return storage_activity_document;
};
