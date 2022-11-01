module.exports = (sequelize, DataTypes) => {
  const notifications = sequelize.define("notifications", {
    date: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    redirect_to : {
      type : DataTypes.STRING(300),
      allowNull : true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    is_read: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  });

  notifications.associate = (models) => {};
  return notifications;
};
