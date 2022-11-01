module.exports = (sequelize, DataTypes) => {
  const user_role_company = sequelize.define("user_role_company", {
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "user_id is empty",
        },
      },
    },
    role_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "role_id is empty",
        },
      },
    },
    company_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    surveyor_type: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    surveyor_category: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    surveyor_session: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    from_date: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    to_date: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    status: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  });
  return user_role_company;
};
