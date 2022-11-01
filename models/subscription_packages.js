module.exports = (sequelize, DataTypes) => {
  const subscription_packages = sequelize.define('subscription_packages', {
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'name is empty'
        }
      },
    }, amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'amount is empty'
        }
      },
    }, no_client_admin: {
      type: DataTypes.INTEGER,
      allowNull: true,

    }, no_updater: {
      type: DataTypes.INTEGER,
      allowNull: true,

    }, no_viewer: {
      type: DataTypes.INTEGER,
      allowNull: true,

    }, no_internel_surveyor: {
      type: DataTypes.INTEGER,
      allowNull: true,

    }, no_externel_surveyor: {
      type: DataTypes.INTEGER,
      allowNull: true,

    }, duration_count: {
      type: DataTypes.INTEGER,
      allowNull: true,

    }, duration: {
      type: DataTypes.STRING(255),
      allowNull: true,

    }, status: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  });

 
  return subscription_packages;
}