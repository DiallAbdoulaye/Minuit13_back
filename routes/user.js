import { Model } from 'sequelize';
import bcrypt from 'bcrypt';

const MIN_PASSWORD_LENGTH = 7;

export default class User extends Model {
  static init(sequelize, DataTypes) {
    return super.init(
      {
        uuid: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        email: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: {
            isEmail: true,
          },
          unique: {
            args: true,
            msg: 'email address already in use',
          },
        },
        nickname: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: {
            args: true,
            msg: 'nickname already in use',
          },
        },
        password: {
          type: DataTypes.VIRTUAL,
          validate: {
            isLongEnough(value) {
              if (value.length < MIN_PASSWORD_LENGTH) {
                throw new Error('Password too short');
              }
            },
          },
        },
        password_confirmation: {
          type: DataTypes.VIRTUAL,
          validate: {
            isEqual(value) {
              if (this.passport !== value) {
                throw new Error("Password don't match");
              }
            },
          },
        },
        password_digest: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: {
            notEmpty: true,
          },
        },
      },
      {
        sequelize,
        hooks: {
          async beforeValidate(user, options) {
            if (user.isNewRecord) {
              const SALT_ROUND = 10;
              const hash = await bcrypt.hash(user.password, SALT_ROUND);
              if (hash === null) {
                throw new Error("Can't hash password.");
              }
              user.password_digest = hash;
            }
          },
        },
      },
    );
  }

  async checkPassword(password) {
    return await bcrypt.compare(password, this.password_digest);
  }

  toJSON() {
    const obj = Object.assign({}, this.get());
    delete obj.password;
    delete obj.password_confirmation;
    delete obj.password_digest;
    return obj;
  }
}
