// console.log('Db.js')

const Sequelize = require('sequelize');

// определяем объект Sequelize
const sequelize = new Sequelize('notes', 'notes', 'notes', {
	dialect: 'mysql',
	host   : '127.0.0.1',
	define : {
		// timestamps: false,
	},
	logging: console.log,
});
module.exports.sequelize = sequelize


/**
 * Пользователи
 * @type {sequelize.Model<>}
 */
module.exports.Users = sequelize.define(
	'users',
	{
		id      : {
			type         : Sequelize.BIGINT,
			autoIncrement: true,
			primaryKey   : true,
			allowNull    : false,
		},
		email   : {
			type     : Sequelize.STRING,
			allowNull: false,
			validate : {
				isEmail: {
					msg: 'wrong format email',
				},
			},
		},
		password: {
			type     : Sequelize.STRING('500'),
			allowNull: false,
			validate : {
				min: 10,
			},
		},

		// Данные сессий для контроля авторизации через браузер
		session_tokens: {
			type        : Sequelize.TEXT('long'),
			allowNull   : true,
			defaultValue: null,
		},

		// Данные по токену для АПИ
		api_token              : {
			type        : Sequelize.STRING,
			allowNull   : true,
			defaultValue: null,
		},
		api_token_add_date     : {
			type        : Sequelize.DATE,
			allowNull   : true,
			defaultValue: null,
		},
		api_token_end_date     : {
			type        : Sequelize.DATE,
			allowNull   : true,
			defaultValue: null,
		},
		api_token_end_unix_time: {
			type        : Sequelize.INTEGER,
			allowNull   : true,
			defaultValue: null,
		},
	},
	{
		uniqueKeys: {
			email_unique: {
				fields: ['email',]
			}
		},
		engine    : 'InnoDB',
		charset   : 'utf8mb4',
	}
)


/**
 * Заметки
 * @type {sequelize.Model<>}
 */
module.exports.Notes = sequelize.define(
	'notes',
	{
		id       : {
			type         : Sequelize.BIGINT,
			autoIncrement: true,
			primaryKey   : true,
			allowNull    : false,
		},
		user_id  : {
			type     : Sequelize.BIGINT,
			allowNull: false,
		},
		shared   : {
			type        : Sequelize.ENUM,
			values      : ['yes',],
			allowNull   : true,
			defaultValue: null,
		},
		note_text: {
			type        : Sequelize.STRING('1000'),
			allowNull   : false,
			defaultValue: '',
		},
	},
	{
		indexes: [
			{
				unique: false,
				fields: ['user_id',]
			}
		],
		engine : 'InnoDB',
		charset: 'utf8mb4',
	}
)