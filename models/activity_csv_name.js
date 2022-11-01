module.exports = (sequelize, DataTypes) => {
  const activity_csv_name = sequelize.define('activity_csv_name', {
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
    name: {
      type: DataTypes.STRING(255),
      allowNull: true,

    }, 
    library_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'library_id is empty'
        }
      },
    },
    type: {
      type: DataTypes.INTEGER,
      allowNull: true,

    }, status: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  }, {
    indexes: [
      {
          unique: true,
          fields: ['name', 'library_id','type']
      }
  ]});
  return activity_csv_name;
}