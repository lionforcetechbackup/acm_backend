module.exports=(sequelize,DataTypes)=>{        
        const countries = sequelize.define('countries',{
          country:{
                type : DataTypes.STRING(255),
                allowNull : false,
                validate: {
                          notEmpty:{
                              msg:'country is empty'
                            }
                             },
              },country_code:{
                type : DataTypes.STRING(255),
                allowNull : true,
                
              },international_dialing:{
                type : DataTypes.STRING(255),
                allowNull : true,
                
              },status:{
    type: DataTypes.INTEGER,
      allowNull: true,
  },
        });
          return countries;
             }