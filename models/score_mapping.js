module.exports = (sequelize, DataTypes) => {
  const score_mapping = sequelize.define("score_mapping", {
    library_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "library_id is empty",
        },
      },
    },
    organization_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "organization id is empty",
        },
      },
    },
    chapter_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "chapter_id is empty",
        },
      },
    },
    standard_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "standard_id is empty",
        },
      },
    },
    substanard_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "substanard_id is empty",
        },
      },
    },
    updator_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    internal_surveyor_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    external_surveyor_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    updator_score: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    updator_assesment_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    internal_surveyor_score: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    internal_surveyor_assesment_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    external_surveyor_score: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    external_surveyor_assesment_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    updator_comment: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    internal_surveyor_comment: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    external_surveyor_comment: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  });
  score_mapping.associate = (models) => {
    score_mapping.belongsTo(models.users, {
      foreignKey: "updator_id",
      as: "updatorJoin",
    });
    score_mapping.belongsTo(models.users, {
      foreignKey: "internal_surveyor_id",
      as: "internalSurveyorJoin",
    });
    score_mapping.belongsTo(models.users, {
      foreignKey: "external_surveyor_id",
      as: "externalSurveyorJoin",
    });
    score_mapping.belongsTo(models.libraries, {
      foreignKey: "library_id",
      as: "libraryJoin",
    });
    // score_mapping.belongsTo(models.libraries, {foreignKey: 'library_id', as: 'libraryJoin'});
    score_mapping.belongsTo(models.organizations, {
      foreignKey: "organization_id",
      as: "organizationScoreJoin",
    });
    score_mapping.belongsTo(models.sub_standards, {
      foreignKey: "substanard_id",
      as: "substandardJoin",
    });
    // score_mapping.hasMany(models.activity_mapping, { foreignKey: 'substanard_id', as: 'activitymappingJoin' });
  };
  return score_mapping;
};
