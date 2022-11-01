module.exports = (sequelize, DataTypes) => {
  const lookups = sequelize.define("lookups", {
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
    chaptername: {
      type: DataTypes.STRING(455),
      allowNull: false,
      unique: true,
      // unique: {
      //   args: true,
      //   msg: 'library already in use!'
      // }
    },
    standardname: {
      type: DataTypes.STRING(455),
      allowNull: false,
      unique: true,
      // unique: {
      //   args: true,
      //   msg: 'library already in use!'
      // }
    },
    substandardname: {
      type: DataTypes.STRING(455),
      allowNull: false,
      unique: true,
      // unique: {
      //   args: true,
      //   msg: 'library already in use!'
      // }
    },
  });

  lookups.associate = (models) => {
    lookups.belongsTo(models.libraries, {
      foreignKey: "library_id",
      as: "libraryjoin",
    });
  };
  return lookups;
};
