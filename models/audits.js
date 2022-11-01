module.exports=(sequelize,DataTypes)=>{        
        const audits = sequelize.define('audits',{
          user_id:{
                type : DataTypes.INTEGER,
                allowNull : true,
                
              },table_name:{
                type : DataTypes.STRING(255),
                allowNull : true,
                
              },primary_id:{
                type : DataTypes.STRING(255),
                allowNull : true,
                
              },event:{
                type : DataTypes.STRING(255),
                allowNull : true,
                
              },old_value:{
                type : DataTypes.TEXT,
                allowNull : true,
                
              },new_value:{
                type : DataTypes.TEXT,
                allowNull : true,
                
              },url:{
                type : DataTypes.STRING(255),
                allowNull : true,
                
              },ip_address:{
                type : DataTypes.STRING(255),
                allowNull : true,
                
              },user_agent:{
                type : DataTypes.STRING(500),
                allowNull : true,
                
              },log_in:{
                type : DataTypes.DATE,
                allowNull : true,
                
              },log_out:{
                type : DataTypes.DATE,
                allowNull : true,
                
              },status:{
    type: DataTypes.INTEGER,
      allowNull: true,
  },
        });
          return audits;
             }