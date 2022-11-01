module.exports = (sequelize, DataTypes) => {
  const download_samples = sequelize.define('download_samples', {
    link: {
      type: DataTypes.STRING(255),
      allowNull: false,

    }, type: {
      type: DataTypes.STRING(255),
      allowNull: true,

    }, status: {
      type: DataTypes.INTEGER,
      allowNull: true,
    }, 
    createdBy: {
      allowNull: true,
      type: DataTypes.INTEGER(11)
    },
    updatedBy: {
      allowNull: true,
      type: DataTypes.INTEGER(11)
    },
  });
  download_samples.associate = models => {
    download_samples.belongsTo(models.users, { foreignKey: 'createdBy', as: 'users' });
  }
  return download_samples;
}