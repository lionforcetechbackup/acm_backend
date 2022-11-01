module.exports = (sequelize, DataTypes) => {
  const surveyor_categories = sequelize.define("surveyor_categories", {
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
    category_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    library_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    created_date: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  });
  return surveyor_categories;
};
