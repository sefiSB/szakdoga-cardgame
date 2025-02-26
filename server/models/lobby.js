"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Lobby extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Lobby.hasMany(models.User, { foreignKey: "lobby_id" });
      Lobby.hasOne(models.Host, {
        foreignKey: "lobby_id",
      });
    }
  }
  Lobby.init(
    {
      code: DataTypes.STRING,
      status: DataTypes.ENUM("waiting", "ongoing", "ended"),
    },
    {
      sequelize,
      modelName: "Lobby",
    }
  );
  return Lobby;
};
