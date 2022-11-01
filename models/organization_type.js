module.exports = (sequelize, DataTypes) => {
  const organization_type = sequelize.define('organization_type', {
    type: {
      type: DataTypes.STRING(255),
      allowNull: true,

    }, status: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  });
//   organization_type.associate = (models) => {
//     // organizations.belongsTo(models.subscription_packages, {foreignKey: 'package', as: 'subscriptionPackage'});
//     models.organizations.belongsTo(organization_type, {foreignKey: 'organization_type', as: 'organizationtype'});
//  }
  return organization_type;
}