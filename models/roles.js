module.exports = (sequelize, DataTypes) => {
  const roles = sequelize.define('roles', {
    role_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'role_name is empty'
        }
      },
    }, status: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  });
  return roles;
}