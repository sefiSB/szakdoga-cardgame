'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Host extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Host.belongsTo(models.User,{
        foreignKey: "host_id",
      });
      Host.belongsTo(models.Lobby,{
        foreignKey: "lobby_id",
      });
    }
  }
  Host.init({

  }, {
    sequelize,
    modelName: 'Host',
  });
  return Host;
};