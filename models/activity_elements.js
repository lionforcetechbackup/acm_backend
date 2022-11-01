module.exports = (sequelize, DataTypes) => {
  const activity_elements = sequelize.define("activity_elements", {
    id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      primaryKey: true,
      // unique: {
      //   args: true,
      //   msg: 'library already in use!'
      // }
    },
    admin_activity_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    client_activity_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    substandard_id: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    element_code: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    parent_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      hierarchy: true,
    },
    element_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    element_response: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    organization_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  });
  activity_elements.associate = (models) => {
    activity_elements.hasMany(activity_elements, {
      as: "children",
      foreignKey: "parent_id",
    });
    activity_elements.belongsTo(activity_elements, {
      as: "parent",
      foreignKey: "parent_id",
    });
  };

  return activity_elements;
};
