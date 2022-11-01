module.exports = (sequelize, DataTypes) => {
  const storage_activity_checklist_elements = sequelize.define(
    "storage_activity_checklist_elements",
    {
      storage_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      element_id: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      attachment_link: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      response: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      comments: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      status: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    }
  );
  storage_activity_checklist_elements.associate = (models) => {
    // storage_activity_checklist_elements.has(models.storage_activity_checklist, { foreignKey: 'storage_id', as: 'storage_activity_checklist' });
    storage_activity_checklist_elements.belongsTo(models.activity_elements, {
      foreignKey: "element_id",
      as: "activity_elements",
    });
    storage_activity_checklist_elements.belongsTo(
      models.storage_activity_checklist,
      { foreignKey: "storage_id", as: "file_id" }
    );
  };
  return storage_activity_checklist_elements;
};
