module.exports = (sequelize, DataTypes) => {
  const standards = sequelize.define(
    "standards",
    {
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
      chapter_id: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      code: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      indexes: [
        {
          unique: true,
          fields: ["name", "chapter_id"],
        },
      ],
    }
  );
  standards.associate = (models) => {
    // standards.belongsTo(models.sub_standards, {foreignKey: 'standard_id', as:'standardjoin'});
    standards.belongsTo(models.chapters, {
      foreignKey: "chapter_id",
      as: "chapterjoin",
    });
  };
  return standards;
};
