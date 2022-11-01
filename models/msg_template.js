module.exports = (sequelize, DataTypes) => {
  const msgtemplate = sequelize.define("msgtemplate", {
    msgtype: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  });

  msgtemplate.associate = (models) => {};
  return msgtemplate;
};
