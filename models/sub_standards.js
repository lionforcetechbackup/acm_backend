module.exports = (sequelize, DataTypes) => {
  const sub_standards = sequelize.define(
    "sub_standards",
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
      standard_id: {
        type: DataTypes.STRING(255),
        unique: true,
        references: {
          model: "standards",
          key: "id",
        },
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "standard_id is empty",
          },
        },
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      code: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "code is empty",
          },
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "description is empty",
          },
        },
      },
      esr: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      surveyor_category_id: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      session_class_id: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      unit_focus_area: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      file: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      document_title: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      substandard_uid: {
        type: DataTypes.TEXT,
        allowNull: false,       
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
          fields: ["name", "standard_id"],
        },
      ],
    }
  );
  sub_standards.associate = (models) => {
    sub_standards.belongsTo(models.standards, {
      foreignKey: "standard_id",
      as: "standardjoin",
    });
  };
  // sub_standards.associate = models => {
  //     User.belongsToMany(Team, { through: 'users_teams'});
  // Team.belongsToMany(User, { through: 'users_teams'});

  // Folder.belongsToMany(Team, { through: 'teams_folders'});
  // Team.belongsToMany(Folder, { through: 'teams_folders'});
  // sub_standards.belongsTo(models.standards, {foreignKey:'standard_id'});
  // sub_standards.belongsTo(models.standards, {foreignKey: 'standard_id', as:'standardjoin'});

  // Team.belongsToMany(User, {through: 'users_teams',foreignKey: 'team_id', otherKey: 'user_id'});
  // sub_standards.belongsTo(models.subscription_packages, {foreignKey: 'package', as: 'subscriptionPackage'});
  //  }
  //  organizations.associate = models => {
  //   organizations.belongsTo(models.subscription_packages, {foreignKey: 'package', as: 'subscriptionPackage'});
  // }

  return sub_standards;
};
