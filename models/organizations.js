module.exports = (sequelize, DataTypes) => {
  const organizations = sequelize.define('organizations', {
    name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    }, company_type: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'company_type is empty'
        }
      }, 
    }, organization_type: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'organization_type is empty'
        }
      },
    }, parent_id: {
      type: DataTypes.INTEGER,
      allowNull: true,

    }, email: {
      type: DataTypes.STRING(255),
      allowNull: true,
    }, country: {
      type: DataTypes.INTEGER,
      allowNull: true,

    }, state: {
      type: DataTypes.STRING(255),
      allowNull: true,

    }, city: {
      type: DataTypes.STRING(255),
      allowNull: true,

    }, address: {
      type: DataTypes.STRING(255),
      allowNull: true,

    }, zipcode: {
      type: DataTypes.STRING(255),
      allowNull: true,

    }, mobile_no: {
      type: DataTypes.BIGINT,
      allowNull: true,

    }, contact_person: {
      type: DataTypes.STRING(255),
      allowNull: true,

    }, package: {
      type: DataTypes.INTEGER,
      allowNull: true,

    }, no_client_admin: {
      type: DataTypes.INTEGER,
      allowNull: true,

    }, no_viewer: {
      type: DataTypes.INTEGER,
      allowNull: true,

    }, no_surveyor: {
      type: DataTypes.INTEGER,
      allowNull: true,

    }, no_updator: {
      type: DataTypes.INTEGER,
      allowNull: true,

    }, user_added: {
      type: DataTypes.INTEGER,
      allowNull: true,

    }, package_start : {
      type: DataTypes.DATEONLY,
      allowNull: true,
    }, valid_from: {
      type: DataTypes.STRING(500),
      allowNull: true,

    }, valid_to: {
      type: DataTypes.STRING(500),
      allowNull: true,

    }, status: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  });
  organizations.associate = (models) => {
     organizations.belongsTo(models.subscription_packages, {foreignKey: 'package', as: 'subscriptionPackage'});
     organizations.belongsTo(models.organization_type, {foreignKey: 'organization_type', as: 'organizationtype'});
     organizations.hasMany(models.organization_libraries, {as : 'library', foreignKey : 'organization_id'});
     organizations.hasMany(organizations, {as: 'children', foreignKey: 'parent_id'});

  }
  return organizations;
} 