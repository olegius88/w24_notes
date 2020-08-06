const crypto = require('crypto');
const moment = require('moment');
const hasher = require('wordpress-hash-node');

const db = require('./Db');
const Auth = require('./Auth');


/**
 * Работа с API
 */
class Api {

	constructor() {
		// console.log('Api|constructor',)


		/**
		 * Время жизни токена
		 * @type {number}
		 */
		this.tokenLifetimeSec = 30000;


		/**
		 * Перечень валидных токенов
		 * @type {{}}
		 */
		this.validTokens = {}
		// Для теста
		// this.validTokens['1'] = 'KitYxBAggryo1sTnCYeUVul6DLo='
	}


	/**
	 * Генератор токена
	 *
	 * @param stringBase
	 * @param byteLength
	 * @returns {Promise<unknown>}
	 */
	generateToken({stringBase = 'base64', byteLength = 48} = {}) {
		return new Promise((resolve, reject) => {
			crypto.randomBytes(byteLength, (error, buffer) => {
				if (error) {
					reject(error);
					return
				}
				resolve(buffer.toString(stringBase));
			});
		});
	}


	/**
	 * Сверка паролей
	 *
	 * @param pass1
	 * @param pass2
	 * @returns {boolean}
	 */
	checkPassword(pass1, pass2) {
		return hasher.CheckPassword(pass1, pass2)
	}

	/**
	 * Очистка просроченных данных
	 *
	 * @private
	 */
	_clearUserValidTokens(userId) {
		console.log('_clearUserValidTokens|userId=', userId, ClsApi.validTokens);
		delete ClsApi.validTokens[userId];
	}


	/**
	 * Смена токена у пользователя
	 *
	 * @param $data
	 * @returns {Promise<{line: *, status: string}>}
	 */
	async changeUserToken($data) {

		if (!$data.user_id) {
			console.error('changeUserToken|!$data.user_id|$data=', $data)
			return {
				status: 'error',
				// line  : __fili,
			}
		}

	  const shortToken = await this.generateToken({byteLength: 20});
	  console.log('changeUserToken|shortToken=', shortToken);

		const unixInt = moment().unix() + ClsApi.tokenLifetimeSec; // время жизни токена

		let updRes
		const uq = {
			api_token              : shortToken,
			api_token_end_unix_time: unixInt,
			api_token_end_date     : moment.unix(unixInt).format("YYYY-MM-DD HH:mm:ss"),
			api_token_add_date     : moment().format(`YYYY-MM-DD HH:mm:ss`),
		}
		try {
			updRes = await db.Users.update(uq, {where: {id: $data.user_id}})
			console.log('changeUserToken|update|updRes=', updRes)
			// changeUserToken|update|updRes= [ 1 ]

		} catch (error) {
			console.error('changeUserToken|update|error=', error)
			return {
				status: 'error',
				// line  : __fili,
			}
		}

		if (!updRes[0]) {
			return {
				status: 'user_not_found',
				// line  : __fili,
			}
		}

		const user_id = $data.user_id.toString();
		// Запись в переменную для сравнивания
		ClsApi.validTokens[user_id] = shortToken;
		// Удаление записи через указанное время
		setTimeout(ClsApi._clearUserValidTokens, (ClsApi.tokenLifetimeSec*1000), user_id);


		return {
			status : 'ok',
			token  : shortToken,
			user_id: $data.user_id,
			line   : __fili,

			api_token_end_unix_time: uq.api_token_end_unix_time,
			api_token_end_date     : uq.api_token_end_date,
		}
	}


	/**
	 * Авторизация пользователя
	 */
	async userLogin($data){
		console.log('userLogin|$data=', $data)

		if (!$data.email) {
			return {
				status: 'error',
				msg   : 'email incorrect',
				// line  : __fili,
			}
		}
		if (!$data.password) {
			return {
				status: 'error',
				msg   : 'password incorrect',
				// line  : __fili,
			}
		}

		let fRes
		try {
			fRes = await db.Users.findOne({where: {email: $data.email}, raw: true})
			// console.log('emailExists|fRes=', fRes)

		} catch (error) {
			console.error('emailExists|error=', error)
			return {
				status: 'error',
				msg   : 'Ошибка в получении данных',
				// line  : __fili,
			}
		}

		if (!fRes) {
			return {
				status: 'not_found',
				msg   : 'Пользователь не найден',
				// line  : __fili,
			}
		}

		if (!ClsApi.checkPassword($data.password, fRes.password)) {
			return {
				status: 'credential_error',
				msg   : 'Пароль не верен.',
				// line  : __fili,
			}
		}

		const userId = fRes.id.toString()

		// Если есть действующий токен
		if (ClsApi.validTokens[userId]) {
			return {
				status : 'ok',
				token  : fRes.api_token,
				user_id: fRes.id,
				line   : __fili,

				api_token_end_unix_time: fRes.api_token_end_unix_time,
				api_token_end_date     : fRes.api_token_end_date,
			}
		}

		// console.log('emailExists|fRes=', (fRes.api_token_end_unix_time > moment().unix()), fRes.api_token_end_unix_time, moment().unix())

		// Если токен не просрочен (для случаев, когда сервис перезагружался и все переменные очистились)
		if (fRes.api_token_end_unix_time > moment().unix()) {
			ClsApi.validTokens[userId] = fRes.api_token;
			return {
				status : 'ok',
				token  : fRes.api_token,
				user_id: fRes.id,
				line   : __fili,

				api_token_end_unix_time: fRes.api_token_end_unix_time,
				api_token_end_date     : fRes.api_token_end_date,
			}
		}

		// Смена токена у пользователя
		return await this.changeUserToken({user_id: fRes.id})
	}


	/**
	 * Авторизация пользователя
	 *
	 * @param req
	 * @param res
	 * @param next
	 * @returns {Promise<*>}
	 */
	async auth(req, res, next) {
		console.log('api|auth|req.query=', req.query)

		const ucRes = await ClsApi.userLogin({
			email   : req.query.email,
			password: req.query.password,
		})
		console.log('auth|ucRes=', ucRes);
		/*
	authenticate|ucRes= {
		status: 'ok',
		data: {
			add_date: Literal { val: 'CURRENT_TIMESTAMP' },
			upd_date: Literal { val: 'CURRENT_TIMESTAMP' },
			session_tokens: null,
			id: 1,
			email: 'sh.oleg@list.ru',
			password: '$P$BK/bGdFqMPkTuj98WiPUanW5rn/aNx.',
			updatedAt: 2020-08-05T10:17:30.624Z,
			createdAt: 2020-08-05T10:17:30.624Z
		},
		line: 'F:\\phpstorm\\projects\\w24_notes\\Auth.js:473'
	}  */
		if (ucRes.status != 'ok') {
			return res.json(ucRes);
		}

		res.json({
			status                 : 'ok',
			user_id                : ucRes.user_id,
			token                  : ucRes.token,
			api_token_end_unix_time: ucRes.api_token_end_unix_time,
			api_token_end_date     : ucRes.api_token_end_date,
		})
	}


	/**
	 * Разлогин пользователя со сбросом всех сессий пользователя
	 *
	 * @returns {Promise<*>}
	 */
	async logout($data) {
		// console.log('api|logout|$data=', $data)

		// Проверка токена
		const tvRes = await ClsApi.tokenValidator({
			user_id: $data.user_id,
			token  : $data.token,
		})
		// console.log('notes|tvRes=', tvRes)
		if (tvRes.status != 'ok') {
			return tvRes
		}

		// Удаление данных токена
		delete ClsApi.validTokens[$data.user_id.toString()]

		let updRes
		const uq = {
			// токен
			api_token              : null,
			api_token_end_unix_time: null,
			api_token_end_date     : null,
			api_token_add_date     : null,
			// сессия для браузера
			session_tokens: null,
		}
		try {
			updRes = await db.Users.update(uq, {where: {id: $data.user_id}})
			console.log('logout|update|updRes=', updRes)
			// logout|update|updRes= [ 1 ]

		} catch (error) {
			console.error('logout|update|error=', error)
			return {
				status: 'error',
				// line  : __fili,
			}
		}

		return {
			status: 'ok',
		}
	}


	/**
	 * Регистрация пользователя
	 *
	 * @returns {Promise<*>}
	 */
	async userCreate($data) {
		// console.log('userCreate|$data=', $data)

		const ucRes = await Auth.userCreate({
			email   : $data.email,
			password: $data.password,
		})
		// console.log('userCreate|ucRes=', ucRes);
		/*
 userCreate|ucRes= {
	status: 'ok',
	data: {
		add_date: Literal { val: 'CURRENT_TIMESTAMP' },
		upd_date: Literal { val: 'CURRENT_TIMESTAMP' },
		session_tokens: null,
		id: 1,
		email: 'sh.oleg@list.ru',
		password: '$P$BK/bGdFqMPkTuj98WiPUanW5rn/aNx.',
		updatedAt: 2020-08-05T10:17:30.624Z,
		createdAt: 2020-08-05T10:17:30.624Z
	},
	line: 'F:\\phpstorm\\projects\\w24_notes\\Auth.js:473'
}   */

		if (ucRes.status != 'ok') {
			return ucRes;
		}

		if (ucRes.status == 'email_exists') {
			return ucRes
		}

		const cuRes = await ClsApi.changeUserToken({user_id: ucRes.data.id,})
		// console.log('reg|cuRes=', cuRes);
		/*
reg|cuRes= {
	status: 'ok',
	token: 'W+auQR2qp5s5evdXXNTptKhfZpw=',
	user_id: 5,
	line: 'F:\\phpstorm\\projects\\w24_notes\\Api.js:101',
	api_token_end_unix_time: 1596631104,
	api_token_end_date: '2020-08-05 18:38:24'
}    */

		return {
			status                 : 'ok',
			user_id                : cuRes.user_id,
			token                  : cuRes.token,
			api_token_end_unix_time: cuRes.api_token_end_unix_time,
			api_token_end_date     : cuRes.api_token_end_date,
		}
	}


	/**
	 * Проверка токена
	 *
	 * @param $data
	 * @returns {Promise<void>}
	 */
	async tokenValidator($data) {

		if (!$data.user_id) {
			console.error('tokenValidator|!$data.user_id|$data=', $data)
			return {
				status: 'error',
				// line  : __fili,
			}
		}
		if (!$data.token) {
			console.error('tokenValidator|!$data.token|$data=', $data)
			return {
				status: 'error',
				// line  : __fili,
			}
		}

		const user_id = $data.user_id.toString();

		if (!ClsApi.validTokens[user_id]) {
			return {
				status: 'token_invalid',
				// line  : __fili,
			}
		}

		if (ClsApi.validTokens[user_id] != $data.token) {
			return {
				status: 'token_invalid',
				// line  : __fili,
			}
		}

		return {
			status: 'ok',
			// line  : __fili,
		}
	}
}

const ClsApi = new Api();
module.exports = ClsApi;