module.exports = (sequelize, DataTypes) => {
  const storage_activity_checklist = sequelize.define(
    "storage_activity_checklist",
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
        type: DataTypes.INTEGER,
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
      file_no: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "file_no is empty",
          },
        },
      },
      response_frequency: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      response_date: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "response_date is empty",
          },
        },
      },
      file_status: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      score: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      status: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    }
  );
  storage_activity_checklist.associate = (models) => {
    storage_activity_checklist.belongsTo(models.users, {
      foreignKey: "updator_id",
      as: "userDetail",
    });
    storage_activity_checklist.belongsTo(models.admin_activities, {
      foreignKey: "admin_activity_id",
      as: "adminActivityDetail",
    });
    storage_activity_checklist.belongsTo(models.client_admin_activities, {
      foreignKey: "client_activity_id",
      as: "clientActivityDetail",
    });
    storage_activity_checklist.hasMany(
      models.storage_activity_checklist_elements,
      { as: "element", foreignKey: "storage_id" }
    );
    storage_activity_checklist.belongsTo(models.organizations, {
      foreignKey: "organization_id",
      as: "organizationScoreJoin",
    });

    // db.meal.belongsTo(db.food, {foreignKey : 'idFood'});
  };
  // storage_activity_document.associate = models => {
  //   storage_activity_document.belongsTo(models.users, { foreignKey: 'updator_id', as: 'userDetail' });
  //   storage_activity_document.belongsTo(models.admin_activities, { foreignKey: 'admin_activity_id', as: 'adminActivityDetail' });
  //   storage_activity_document.belongsTo(models.client_admin_activities, { foreignKey: 'client_activity_id', as: 'clientActivityDetail' });
  // }
  return storage_activity_checklist;
};
