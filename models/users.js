// const { DataTypes } = require("sequelize/types");
// const { sequelize } = require(".");
const db = require("../models");
const bcrypt = require("bcrypt");

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "users",
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "Please enter your name",
          },
          notNull: {
            msg: "Name field Empty",
          },
        },
      },
      role_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      // user_id: {
      //   type: DataTypes.INTEGER,
      //   allowNull: false,
      // },
      organization_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      parent_organization_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isUnique: (value, next) => {
            User.findAll({
              where: { email: value },
              attributes: ["id"],
            })
              .then((user) => {
                if (user.length != 0) next(new Error("Email already Exists"));
                next();
              })
              .catch((onError) => console.log(onError));
          },
        },
      },
      mobile_number: {
        type: DataTypes.BIGINT(11),
        allowNull: true,
        validate: {
          notEmpty: {
            msg: "mobile number Not empty",
          },
        },
      },

      password: {
        type: DataTypes.STRING(64),
        // is: /^[0-9a-f]{64}$/i
        // validate: {
        //   is: {
        //     args: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[#$^+=!*()@%&]).{8,}$/,
        //     msg: "The password must contain atleast 8 characters including at least 1 uppercase, 1 lowercase and one digit.",
        //   },
        // },
      },
      temporary_password: {
        type: DataTypes.STRING(64),
      },
      surveyor_type: DataTypes.STRING(255),
      surveyor_category: DataTypes.TEXT,
      surveyor_session: DataTypes.TEXT,
      jwt: DataTypes.STRING(500),
      avatar: DataTypes.STRING(500),
      otp: DataTypes.STRING,
      status: DataTypes.INTEGER,
      from_date: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      to_date: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      hooks: {
        beforeUpdate: (user) => {
          console.log("test");
          const salt = bcrypt.genSaltSync();
          user.password = bcrypt.hashSync(user.password, salt);
          // user.temporary_password = bcrypt.hashSync(user.temporary_password, salt);
        },
        beforeCreate: (user) => {
          console.log(user);

          const salt = bcrypt.genSaltSync();
          user.password = bcrypt.hashSync(user.password, salt);
          // user.temporary_password = bcrypt.hashSync(user.temporary_password, salt);
        },
      },
      // instanceMethods: {
      //   generateHash(password) {
      //     return bcrypt.hash(password, bcrypt.genSaltSync(8));
      // },
      //   validPassword: function(password) {
      //     return bcrypt.compareSync(password, this.password);
      //   }
      // }
    }
  );

  User.associate = (models) => {
    User.belongsTo(models.roles, { foreignKey: "role_id", as: "roles" });
    User.belongsTo(models.organizations, {
      foreignKey: "organization_id",
      as: "organizationJoin",
    });
    User.belongsTo(models.organizations, {
      foreignKey: "parent_organization_id",
      as: "parentOrganizationJoin",
    });
    User.belongsTo(models.session_classes, {
      foreignKey: "surveyor_session",
      as: "classdetailsJoin",
    });
    User.belongsTo(models.surveyor_categories, {
      foreignKey: "surveyor_category",
      as: "categorydetailsJoin",
    });
    User.hasMany(models.property_mapping, {
      foreignKey: "user_id",
      as: "property_mapping",
    });
    User.hasMany(models.client_roles, {
      foreignKey: "user_id",
      as: "client_roles",
    });
  };
  return User;
};

//   if(element.Null != 'YES'){
// `validate: {
//   notEmpty:{
//       msg:`+ element.Field +`is empty'
//     },`
//   }`,
