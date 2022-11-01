module.exports = (sequelize, DataTypes) =>{
  const organization_libraries = sequelize.define('organization_libraries',{
    organization_id:{
      type: DataTypes.INTEGER,
      allowNull: true,
    }, library_id:{
      type: DataTypes.INTEGER,
      allowNull: true,
    },archive:{
      type: DataTypes.INTEGER,
      allowNull: true,
    },status:{
      type: DataTypes.INTEGER,
      allowNull: true,
    }
  });
  organization_libraries.associate = models =>{
    organization_libraries.belongsTo(models.libraries,{foreignKey: 'library_id', as: 'libraries'});
    organization_libraries.belongsTo(models.organizations,{ foreignKey: 'organization_id', as: 'organizationJoin' });
 }
  return organization_libraries;
}