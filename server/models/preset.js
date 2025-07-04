'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Preset extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Preset.belongsTo(models.User,{
        foreignKey:"user_id"
      })
    }
  }
  Preset.init({
    name: DataTypes.STRING,
    startingcards: DataTypes.INTEGER,
    cards_on_desk: DataTypes.BOOLEAN,
    revealed: DataTypes.INTEGER,
    hidden: DataTypes.INTEGER,
    maxplayers:DataTypes.INTEGER,
    cardType:DataTypes.STRING,
    packNumber:DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Preset',
  });
  return Preset;
};