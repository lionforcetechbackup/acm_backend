module.exports = (sequelize, DataTypes) => {
  const chapters = sequelize.define("chapters", {
    id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      primaryKey: true
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
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true
      // unique: {
      //   args: true,
      //   msg: 'library already in use!'
      // }
    },
    code: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: true,
    }
    
  }, {
    indexes: [
      {
          unique: true,
          fields: ['name', 'library_id']
      }
  ]
});
  
  chapters.associate = (models) => {
    chapters.belongsTo(models.libraries, {
      foreignKey: "library_id",
      as: "libraryjoin",
    });
  };
  return chapters;
};
