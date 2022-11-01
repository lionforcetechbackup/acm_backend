module.exports=(sequelize,DataTypes)=>{        
        const client_admin_datacollections = sequelize.define('client_admin_datacollections',{
          admin_activity_id:{
                type : DataTypes.STRING(255),
                allowNull : true,
                unique:true,
                
              },client_activity_id:{
                type : DataTypes.INTEGER,
                allowNull : true,
                unique:true,
              },type_of_number:{
                type : DataTypes.INTEGER,
                allowNull : true,
                
              },target:{
                type : DataTypes.STRING(255),
                allowNull : true,
                
              },totarget:{
                type : DataTypes.STRING(255),
                allowNull : true,
                
              },client_id:{
                type : DataTypes.INTEGER,
                allowNull : true,
                
              },organization_id:{
                type : DataTypes.INTEGER,
                allowNull : true,
                
              },status:{
    type: DataTypes.INTEGER,
      allowNull: true,
  },
        });
        client_admin_datacollections.associate = (models) => {
          
          //client_admin_datacollections.belongsTo(models.client_admin_activities, { foreignKey: 'client_activity_id', as:'Datacollections'});
        };
        
          return client_admin_datacollections;
             }