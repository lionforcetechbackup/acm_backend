module.exports = (sequelize, DataTypes) => {
  const activity_mapping = sequelize.define("activity_mapping", {
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
    library_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: {
          msg: "library_id is empty",
        },
      },
    },
    chapter_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
      validate: {
        notEmpty: {
          msg: "chapter_id is empty",
        },
      },
    },
    standard_id: {
      type: DataTypes.STRING(255),
      unique: true,
      allowNull: true,
      validate: {
        notEmpty: {
          msg: "standard_id is empty",
        },
      },
    },
    substandard_id: {
      type: DataTypes.STRING(255),
      unique: true,
      allowNull: true,
      validate: {
        notEmpty: {
          msg: "substandard_id is empty",
        },
      },
    },
    client_activity_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    admin_activity_id: {
      type: DataTypes.STRING(255),
      unique: true,
      allowNull: true,
    },
    organization_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  });
  activity_mapping.associate = (models) => {
    activity_mapping.belongsTo(models.libraries, {
      foreignKey: "library_id",
      as: "libraries_mapping",
    });
    // activity_mapping.belongsTo(models.chapters, { foreignKey: 'chapter_id', as: 'chapter_mapping' });
    activity_mapping.belongsTo(models.standards, {
      foreignKey: "standard_id",
      as: "standards_mapping",
    }); // this was commented before admin side getting error so uncommented
    activity_mapping.belongsTo(models.sub_standards, {
      foreignKey: "substandard_id",
      as: "sub_standards_mapping",
    });
    activity_mapping.belongsTo(models.admin_activities, {
      targetKey: "id",
      foreignKey: "admin_activity_id",
      as: "admin_activities",
    });
    activity_mapping.belongsTo(models.client_admin_activities, {
      foreignKey: "client_activity_id",
      as: "client_activities",
    });

    activity_mapping.belongsTo(models.client_admin_datacollections, {
      targetKey: "client_activity_id",
      foreignKey: "client_activity_id",
      as: "clientAdminDatacollections",
    });
  };
  return activity_mapping;
};
