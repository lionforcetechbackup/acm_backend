module.exports = (sequelize, DataTypes) => {
  const surveyor_session = sequelize.define('surveyor_session', {
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
    code: {
      type: DataTypes.STRING(255),
      allowNull: true,

    }, name: {
      type: DataTypes.STRING(255),
      allowNull: true,

    }, user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'user_id is empty'
        }
      },
    },client_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      }, category_id: {
      type: DataTypes.STRING(255),
      allowNull: true,

    }, class_id: {
      type:DataTypes.STRING(255),
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
    }, date: {
      type: DataTypes.STRING(255),
      allowNull: true,

    },to_date: {
      type: DataTypes.STRING(255),
      allowNull: true,

    }, from_time: {
      type: DataTypes.STRING(255),
      allowNull: true,

    }, to_time: {
      type: DataTypes.STRING(255),
      allowNull: true,

    }, survey_status: {
      type: DataTypes.STRING(255),
      allowNull: true,

    }, status: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  });

  surveyor_session.associate = models => {
    surveyor_session.belongsTo(models.users, {foreignKey: 'user_id', as:'userdetails'});
    surveyor_session.belongsTo(models.session_classes, {foreignKey: 'class_id', as:'classdetails'});
    surveyor_session.belongsTo(models.surveyor_categories, {foreignKey: 'category_id', as:'categorydetails'});
       }
  return surveyor_session;
}