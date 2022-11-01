module.exports = (sequelize, DataTypes) => {
  const storage_activity_kpi_elements = sequelize.define(
    "storage_activity_kpi_elements",
    {
      storage_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "storage_id is empty",
          },
        },
      },
      frequency: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "frequency is empty",
          },
        },
      },
      target: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      totarget: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      actual_value: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      score: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      ytdScore: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      ytdValue: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      responsedate: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "response_date is empty",
          },
        },
      },
      status: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    }
  );
  return storage_activity_kpi_elements;
};
