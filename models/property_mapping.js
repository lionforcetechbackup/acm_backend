module.exports = (sequelize, DataTypes) => {
  const property_mapping = sequelize.define("property_mapping", {
    library_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    organization_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    chapter_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    standard_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    substandard_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    client_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    role_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    deadline: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    assignto: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    expirydate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });
  property_mapping.associate = (models) => {
    property_mapping.belongsTo(models.users, {
      foreignKey: "user_id",
      as: "users",
    });
    property_mapping.belongsTo(models.libraries, {
      foreignKey: "library_id",
      as: "library",
    });
    property_mapping.belongsTo(models.chapters, {
      foreignKey: "chapter_id",
      as: "chapter",
    });
    property_mapping.belongsTo(models.standards, {
      foreignKey: "standard_id",
      as: "standard",
    });
    property_mapping.belongsTo(models.sub_standards, {
      foreignKey: "substandard_id",
      as: "substandard",
    });
  };

  return property_mapping;
};
