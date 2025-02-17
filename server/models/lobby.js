'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Lobby extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Lobby.belongsTo(User),
      Lobby.belongsToMany(User,{
        through:"LobbyUsers"
      })
    }
  }
  Lobby.init({
    code: DataTypes.STRING,
    status: DataTypes.ENUM('waiting', 'ongoing', 'ended')
  }, {
    sequelize,
    modelName: 'Lobby',
  });
  return Lobby;
};