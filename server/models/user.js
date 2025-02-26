"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      User.belongsTo(models.Lobby, {
        foreignKey: "lobby_id",
        as: "lobby",
      });
      User.hasMany(models.Preset, {
        foreignKey: "user_id",
      });
      User.hasOne(models.Host, {
        foreignKey: "host_id",
      });
    }
    toJSON() {
      const userData = this.get();
      if (userData.hasOwnProperty("password")) delete userData.password;
      return userData;
    }
    comparePassword(password) {
      return bcrypt.compareSync(password, this.password);
    }
  }
  User.init(
    {
      username: DataTypes.STRING,
      email: DataTypes.STRING,
      password: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "User",
    }
  );
  return User;
};
