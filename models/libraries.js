module.exports = (sequelize, DataTypes) => {
  const libraries = sequelize.define("libraries", {
    code: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  });

  libraries.associate = (models) => {
    // models.companies.hasMany(libraries,{foreignKey: 'company_id', as: 'libraryForeign'});
    libraries.belongsTo(models.session_classes, {
      foreignKey: "id",
      as: "librarydetails",
    });
  };
  return libraries;
};
