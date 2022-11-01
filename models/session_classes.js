module.exports = (sequelize, DataTypes) => {
  const session_classes = sequelize.define("session_classes", {
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
    class_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    created_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    library_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    surveyor_category_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  });

  session_classes.associate = (models) => {
    session_classes.belongsTo(models.libraries, {
      foreignKey: "library_id",
      as: "librarydetails",
    });
    session_classes.belongsTo(models.surveyor_categories, {
      foreignKey: "surveyor_category_id",
      as: "surveyorCategoriesDetails",
    });
  };

  return session_classes;
};
