module.exports=(sequelize,DataTypes)=>{        
        const unit_focus_areas = sequelize.define('unit_focus_areas',{
          id: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
            primaryKey: true
            // unique: {
            //   args: true,
            //   msg: 'library already in use!'
            // }
          },
          library_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
              notEmpty: {
                msg: 'library_id is empty'
              }
            },
          },name:{
                type : DataTypes.STRING(255),
                allowNull : false,
                validate: {
                          notEmpty:{
                              msg:'name is empty'
                            }
                             },
              },status:{
    type: DataTypes.INTEGER,
      allowNull: true,
  },
        });
          return unit_focus_areas;
             }