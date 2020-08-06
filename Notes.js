const moment = require('moment');

const db = require('./Db');
const Api = require('./Api');
const Auth = require('./Auth');


/**
 * Работа с API
 */
class Notes {

	constructor() {
		console.log('Notes|constructor',)

		this.notesOnPage = 3
		this.notesOnPageMax = 100
	}


	/**
	 * Список заметок для АПИ
	 */
	async notesApi($data) {
		// console.log('notes|$data=', $data)

		// Проверка токена
		const tvRes = await Api.tokenValidator({
			user_id: $data.user_id,
			token  : $data.token,
		})
		// console.log('notes|tvRes=', tvRes)
		if (tvRes.status != 'ok') {
			return tvRes
		}

		return await this.getNotesList($data)
	}


	/**
	 * Указанная заметка
	 *
	 * @param $data
	 * @returns {Promise<{notes: *[], status: string}|{msg: string, status: string}|{msg: string, line: *, status: string}|void>}
	 */
	async noteApi($data) {
		console.log('noteApi|$data=', $data)

		// Проверка токена
		const tvRes = await Api.tokenValidator({
			user_id: $data.user_id,
			token  : $data.token,
		})
		// console.log('notes|tvRes=', tvRes)
		if (tvRes.status != 'ok') {
			return tvRes
		}

		const gRes =  await this.getNote({
			note_id: $data.note_id,
		})
		// console.log('noteBrowser|gRes=', gRes)
		/*
notes|nbRes= {
 status: 'ok',
 note: {
	 id: 1,
	 user_id: 1,
	 shared: null,
	 note_text: 'dgdfgdfgdfg',
	 createdAt: 2020-08-06T04:35:34.000Z,
	 updatedAt: 2020-08-06T04:35:34.000Z
 }
}   */

		if (gRes.status != 'ok') {
			return gRes
		}

		if (!gRes.note.shared && $data.user_id != gRes.note.user_id) {
			return {
				status: 'need_auth',
				msg   : 'Требуется авторизация для доступа к заметке',
				// line  : __fili,
			}
		}

		if (!gRes.note) {
			return {
				status: 'not_found',
				msg   : 'Заметка не найдена',
				// line  : __fili,
			}
		}

		gRes.note.status = 'ok'

		return gRes.note
	}


	/**
	 * Получение заметки для браузера
	 */
	async noteSharedBrowser(req) {
		// console.log('noteSharedBrowser|req=', req)

		const gRes =  await this.getNote({
			note_id: req.params.note_id,
		})
		// console.log('noteBrowser|gRes=', gRes)
		/*
notes|nbRes= {
 status: 'ok',
 note: {
	 id: 1,
	 user_id: 1,
	 shared: null,
	 note_text: 'dgdfgdfgdfg',
	 createdAt: 2020-08-06T04:35:34.000Z,
	 updatedAt: 2020-08-06T04:35:34.000Z
 }
}   */

		if (gRes.status != 'ok') {
			return gRes
		}

		if (!gRes.note) {
			return {
				status: 'not_found',
				msg   : 'Заметка не найдена',
				// line  : __fili,
			}
		}
		if (!gRes.note.shared) {
			return {
				status: 'not_found',
				msg   : 'Заметка не найдена',
				// line  : __fili,
			}
		}

		return gRes
	}


	/**
	 * Получение заметки для браузера
	 */
	async noteBrowser(req) {
		// console.log('notesBrowser|req=', req)

		// Проверка авторизации
		const lRes = await Auth.loggedIn(req)
		// console.log('notesBrowser|aRes=', aRes);

		if (lRes.status != 'ok') {
			return lRes
		}

		const gRes =  await this.getNote({
			note_id: req.params.note_id,
		})
		console.log('noteBrowser|gRes=', gRes)
		/*
notes|nbRes= {
 status: 'ok',
 note: {
	 id: 1,
	 user_id: 1,
	 shared: null,
	 note_text: 'dgdfgdfgdfg',
	 createdAt: 2020-08-06T04:35:34.000Z,
	 updatedAt: 2020-08-06T04:35:34.000Z
 }
}   */

		if (gRes.status != 'ok') {
			return gRes
		}

		if (!gRes.note) {
			return {
				status: 'need_auth',
				msg: 'Требуется авторизация для доступа к заметке',
				// line  : __fili,
			}
		}
		if (lRes.id != gRes.note.user_id) {
			return {
				status: 'need_auth',
				msg: 'Требуется авторизация для доступа к заметке',
				// line  : __fili,
			}
		}

		return gRes
	}


	/**
	 * Редактирование заметки для браузера
	 */
	async editNoteBrowser(req) {
		// console.log('notesBrowser|req=', req)
		console.log('notesBrowser|req.body=', req.body)

		// Проверка авторизации
		const lRes = await Auth.loggedIn(req)
		// console.log('notesBrowser|aRes=', aRes);

		if (lRes.status != 'ok') {
			return lRes
		}

		// Получение заметки
		const gRes =  await this.getNote({
			note_id: req.body.note_id,
		})
		// console.log('noteBrowser|gRes=', gRes)
		/*
notes|nbRes= {
 status: 'ok',
 note: {
	 id: 1,
	 user_id: 1,
	 shared: null,
	 note_text: 'dgdfgdfgdfg',
	 createdAt: 2020-08-06T04:35:34.000Z,
	 updatedAt: 2020-08-06T04:35:34.000Z
 }
}   */

		if (!gRes.note) {
			return {
				status: 'need_auth',
				msg: 'Требуется авторизация для доступа к заметке',
			}
		}
		if (lRes.id != gRes.note.user_id) {
			return {
				status: 'need_auth',
				msg: 'Требуется авторизация для доступа к заметке',
			}
		}

		if (!req.body.note_text) {
			return {
				status: 'error',
				msg: 'Некорректный note_text',
			}
		}
		if (req.body.note_text.length < 1) {
			return {
				status: 'error',
				msg: 'Заметка должна содержать хотя бы 1 символ',
			}
		}
		if (req.body.note_text.length > 1000) {
			return {
				status: 'error',
				msg: 'Заметка должна содержать максимум 1000 символов',
			}
		}

		const qu = {
			note_text: req.body.note_text,
			shared: null,
		}
		if (req.body.share_note) {
			qu.shared = 'yes'
		}

		let updRes
		try {
			updRes = await db.Notes.update(qu, {where: {id: req.body.note_id}, raw: true})
			console.log('userLogin|update|updRes=', updRes)

		} catch (error) {
			console.error('userLogin|update|error=', error)
			return {
				status: 'error',
				// line  : __fili,
			}
		}

		return {
			status : 'ok',
		}
	}


	/**
	 * Добавление заметки для браузера
	 */
	async addNoteBrowser(req) {
		// console.log('addNoteBrowser|req=', req)

		// Проверка авторизации
		const lRes = await Auth.loggedIn(req)
		// console.log('addNoteBrowser|aRes=', aRes);

		if (lRes.status != 'ok') {
			return lRes
		}

		if (!req.body.note_text) {
			return {
				status: 'error',
				msg: 'Некорректный note_text',
			}
		}
		if (req.body.note_text.length < 1) {
			return {
				status: 'error',
				msg: 'Заметка должна содержать хотя бы 1 символ',
			}
		}
		if (req.body.note_text.length > 1000) {
			return {
				status: 'error',
				msg: 'Заметка должна содержать максимум 1000 символов',
			}
		}


		const insertNote = db.Notes.build({user_id: lRes.id, note_text: req.body.note_text,});

		let inRes
		try {
			inRes = await insertNote.save();
			// console.log('notesAdd|inRes=', inRes)
			/*
 notesAdd|inRes= notes {
  dataValues: {
    shared: null,
    id: 5,
    user_id: '1',
    note_text: 'dgdfgdfgdfg',
    updatedAt: 2020-08-05T20:56:26.513Z,
    createdAt: 2020-08-05T20:56:26.513Z
  },
  _previousDataValues: {
    user_id: '1',
    note_text: 'dgdfgdfgdfg',
    id: 5,
    shared: null,
    createdAt: 2020-08-05T20:56:26.513Z,
    updatedAt: 2020-08-05T20:56:26.513Z
  },
  _changed: Set(0) {},
  _options: { isNewRecord: true, _schema: null, _schemaDelimiter: '' },
  isNewRecord: false
}			 */

		} catch (error) {
			console.error('notesAdd|insertNote|error=', error)
			return {
				status: 'error',
				// line  : __fili,
			}
		}

		if (!inRes) {
			return {
				status: 'error',
				// line  : __fili,
			}
		}
		if (!inRes.dataValues) {
			return {
				status: 'error',
				// line  : __fili,
			}
		}

		inRes.dataValues.status = 'ok'

		return inRes.dataValues
	}


	/**
	 * Редактирование заметки для браузера
	 */
	async removeNoteBrowser(req) {
		console.log('removeNoteBrowser|req=', req)

		// Проверка авторизации
		const lRes = await Auth.loggedIn(req)
		// console.log('removeNoteBrowser|aRes=', aRes);

		if (lRes.status != 'ok') {
			return lRes
		}

		const gRes =  await this.getNote({
			note_id: req.params.note_id,
		})
		// console.log('removeNoteBrowser|gRes=', gRes)
		/*
notes|nbRes= {
 status: 'ok',
 note: {
	 id: 1,
	 user_id: 1,
	 shared: null,
	 note_text: 'dgdfgdfgdfg',
	 createdAt: 2020-08-06T04:35:34.000Z,
	 updatedAt: 2020-08-06T04:35:34.000Z
 }
}   */

		if (gRes.status != 'ok') {
			return gRes
		}

		if (!gRes.note) {
			return {
				status: 'need_auth',
				msg: 'Требуется авторизация для доступа к заметке',
			}
		}
		if (lRes.id != gRes.note.user_id) {
			return {
				status: 'need_auth',
				msg: 'Требуется авторизация для доступа к заметке',
			}
		}


		let updRes
		try {
			updRes = await db.Notes.destroy({where: {id: req.params.note_id}, raw: true})
			console.log('removeNoteBrowser|update|updRes=', updRes)

		} catch (error) {
			console.error('removeNoteBrowser|update|error=', error)
			return {
				status: 'error',
				// line  : __fili,
			}
		}

		return {
			status : 'ok',
		}
	}


	/**
	 * Список заметок для браузера
	 */
	async notesBrowser(req) {
		// console.log('notesBrowser|req=', req)

		// Проверка авторизации
		const lRes = await Auth.loggedIn(req)
		// console.log('notesBrowser|aRes=', aRes);

		if (lRes.status != 'ok') {
			return lRes
		}

		return await this.getNotesList({
			user_id: lRes.id,
			note_id: req.params.note_id,
			page: req.params.page_id,
		})
	}


	/**
	 * Получение заметки
	 * @param $data
	 * @returns {Promise<{notes: any[], status: string}|{msg: string, status: string}|{msg: string, line: *, status: string}>}
	 */
	async getNote($data) {

		if ($data.note_id < 1) {
			return {
				status: 'error',
				msg   : 'Некорректный параметр note_id',
			}
		}

		const qu = {
			where: {
				id: $data.note_id,
			},
			raw: true,
		}
		let fRes
		try {
			fRes = await db.Notes.findOne(qu)
			// console.log('notes|fRes=', fRes)
			/*
notes|fRes={
    id: 5,
    user_id: 1,
    shared: null,
    note_text: 'dgdfgdfgdfg',
    createdAt: 2020-08-05T20:56:26.000Z,
    updatedAt: 2020-08-05T20:56:26.000Z
  }	 */

		} catch (error) {
			console.error('notes|error=', error)
			return {
				status: 'error',
				msg   : 'Ошибка в получении данных',
				// line  : __fili,
			}
		}

		if (!fRes) {
			return {
				status: 'not_found',
				msg   : 'Заметка не найдена',
			}
		}

		return {
			status: 'ok',
			note : fRes,
		}
	}


	/**
	 * Получение списка заметок
	 * @param $data
	 * @returns {Promise<{notes: any[], status: string}|{msg: string, status: string}|{msg: string, line: *, status: string}>}
	 */
	async getNotesList($data) {

		// Количество заметок на странице
		let notesOnPage = this.notesOnPage;
		if ($data.notes_on_page > 0) {
			$data.notes_on_page = Number($data.notes_on_page)
			// Защита от различных манипуляций с цифрами
			if ($data.notes_on_page > 0) notesOnPage = $data.notes_on_page;
			if (notesOnPage > this.notesOnPageMax) {
				return {
					status: 'error',
					msg   : `Максимальное количество заметок на странице - ${this.notesOnPageMax}`,
				}
			}
		}

		const qu = {
			where: {
				user_id: $data.user_id
			},
			raw: true,
			limit: notesOnPage,
			order: [['id', 'DESC']]
		}
		if ($data.page > 1) {
			qu.offset = notesOnPage * (Number($data.page)-1)
			// Защита от различных манипуляций с цифрами
			if (qu.offset < 0) delete qu.offset;
		}
		let fRes
		try {
			fRes = await db.Notes.findAll(qu)
			// console.log('notes|fRes=', fRes)
			/*
notes|fRes= [
  {
    id: 5,
    user_id: 1,
    shared: null,
    note_text: 'dgdfgdfgdfg',
    createdAt: 2020-08-05T20:56:26.000Z,
    updatedAt: 2020-08-05T20:56:26.000Z
  },
  {
    id: 4,
    user_id: 1,
    shared: null,
    note_text: 'dgdfgdfgdfg',
    createdAt: 2020-08-05T20:56:25.000Z,
    updatedAt: 2020-08-05T20:56:25.000Z
  },
]			 */

		} catch (error) {
			console.error('notes|error=', error)
			return {
				status: 'error',
				msg   : 'Ошибка в получении данных',
				// line  : __fili,
			}
		}

		const ret = {
			status: 'ok',
			notes : fRes,
		}
		if (fRes.length >= this.notesOnPage ) {
			ret.showForward = true
		}
		return ret;
	}


	/**
	 * Удаление заметки
	 *
	 * @returns {Promise<void>}
	 */
	async notesApiRemove($data) {

		// Проверка токена
		const tvRes = await Api.tokenValidator({
			user_id: $data.user_id,
			token  : $data.token,
		})
		// console.log('notesApiRemove|tvRes=', tvRes)
		if (tvRes.status != 'ok') {
			console.error('notesApiRemove|tvRes.status != ok|$data=', $data)
			return {
				status: 'error',
				// line  : __fili,
			}
		}

		// Получение заметки
		const gRes =  await ClsNotes.getNote({
			note_id: $data.note_id,
		})
		// console.log('notesApiEdit|gRes=', gRes)
		/*
notes|nbRes= {
 status: 'ok',
 note: {
	 id: 1,
	 user_id: 1,
	 shared: null,
	 note_text: 'dgdfgdfgdfg',
	 createdAt: 2020-08-06T04:35:34.000Z,
	 updatedAt: 2020-08-06T04:35:34.000Z
 }
}   */

		if (gRes.status != 'ok') {
			return gRes
		}

		if (!gRes.note) {
			return {
				status: 'need_auth',
				msg: 'Требуется авторизация для доступа к заметке',
			}
		}
		if ($data.user_id != gRes.note.user_id) {
			return {
				status: 'need_auth',
				msg: 'Требуется авторизация для доступа к заметке',
			}
		}

		let updRes
		try {
			updRes = await db.Notes.destroy({where: {id: $data.note_id}, raw: true})
			console.log('notesApiRemove|update|updRes=', updRes)

		} catch (error) {
			console.error('notesApiRemove|update|error=', error)
			return {
				status: 'error',
				// line  : __fili,
			}
		}

		return {
			status : 'ok',
		}
	}


	/**
	 * Редактирование заметки
	 *
	 * @returns {Promise<void>}
	 */
	async notesApiEdit($data) {

		// Проверка токена
		const tvRes = await Api.tokenValidator({
			user_id: $data.user_id,
			token  : $data.token,
		})
		// console.log('notesAdd|tvRes=', tvRes)
		if (tvRes.status != 'ok') {
			console.error('notesApiEdit|tvRes.status != ok|$data=', $data)
			return {
				status: 'error',
				// line  : __fili,
			}
		}

		if (!$data.note_text) {
			console.error('notesApiEdit|!$data.user_id|$data=', $data)
			return {
				status: 'error',
				// line  : __fili,
			}
		}

		// Получение заметки
		const gRes =  await ClsNotes.getNote({
			note_id: $data.note_id,
		})
		// console.log('notesApiEdit|gRes=', gRes)
		/*
notes|nbRes= {
 status: 'ok',
 note: {
	 id: 1,
	 user_id: 1,
	 shared: null,
	 note_text: 'dgdfgdfgdfg',
	 createdAt: 2020-08-06T04:35:34.000Z,
	 updatedAt: 2020-08-06T04:35:34.000Z
 }
}   */

		if (gRes.status != 'ok') {
			return gRes;
		}

		if (!gRes.note) {
			return {
				status: 'need_auth',
				msg: 'Требуется авторизация для доступа к заметке',
			}
		}
		if ($data.user_id != gRes.note.user_id) {
			return {
				status: 'need_auth',
				msg: 'Требуется авторизация для доступа к заметке',
			}
		}


		const qu = {
			note_text: $data.note_text,
			shared   : null,
		}
		if ($data.share_note) {
			qu.shared = 'yes'
		}

		let updRes
		try {
			updRes = await db.Notes.update(qu, {where: {id: $data.note_id}, raw: true})
			console.log('notesApiEdit|update|updRes=', updRes)

		} catch (error) {
			console.error('notesApiEdit|update|error=', error)
			return {
				status: 'error',
				// line  : __fili,
			}
		}

		return {
			status : 'ok',
		}
	}


	/**
	 * Расшаривание заметки для неавторизованного пользователя
	 *
	 * @returns {Promise<void>}
	 */
	async notesShare($data) {

		// Проверка токена
		const tvRes = await Api.tokenValidator({
			user_id: $data.user_id,
			token  : $data.token,
		})
		// console.log('notesAdd|tvRes=', tvRes)
		if (tvRes.status != 'ok') {
			console.error('notesApiEdit|tvRes.status != ok|$data=', $data)
			return {
				status: 'error',
				// line  : __fili,
			}
		}

		// Получение заметки
		const gRes =  await this.getNote({
			note_id: $data.note_id,
		})
		// console.log('notesApiEdit|gRes=', gRes)
		/*
notes|nbRes= {
 status: 'ok',
 note: {
	 id: 1,
	 user_id: 1,
	 shared: null,
	 note_text: 'dgdfgdfgdfg',
	 createdAt: 2020-08-06T04:35:34.000Z,
	 updatedAt: 2020-08-06T04:35:34.000Z
 }
}   */

		if (gRes.status != 'ok') {
			return gRes;
		}

		if (!gRes.note) {
			return {
				status: 'need_auth',
				msg: 'Требуется авторизация для доступа к заметке',
			}
		}
		if ($data.user_id != gRes.note.user_id) {
			return {
				status: 'need_auth',
				msg: 'Требуется авторизация для доступа к заметке',
			}
		}


		const qu = {
			note_text: $data.note_text,
			shared   : null,
		}
		if ($data.share_note) {
			qu.shared = 'yes'
		}

		let updRes
		try {
			updRes = await db.Notes.update(qu, {where: {id: $data.note_id}, raw: true})
			console.log('notesApiEdit|update|updRes=', updRes)

		} catch (error) {
			console.error('notesApiEdit|update|error=', error)
			return {
				status: 'error',
				// line  : __fili,
			}
		}

		return {
			status : 'ok',
		}
	}


	/**
	 * Создание заметки
	 *
	 * @returns {Promise<void>}
	 */
	async notesApiAdd($data) {
		// console.log('notesAdd|$data=', $data)

		// Проверка токена
		const tvRes = await Api.tokenValidator({
			user_id: $data.user_id,
			token  : $data.token,
		})
		// console.log('notesAdd|tvRes=', tvRes)
		if (tvRes.status != 'ok') {
			console.error('tokenValidator|tvRes.status != ok|$data=', $data)
			return {
				status: 'error',
				// line  : __fili,
			}
		}

		if (!$data.note_text) {
			console.error('tokenValidator|!$data.user_id|$data=', $data)
			return {
				status: 'error',
				// line  : __fili,
			}
		}

		const insertNote = db.Notes.build({user_id: $data.user_id, note_text: $data.note_text,});

		let inRes
		try {
			inRes = await insertNote.save();
			// console.log('notesAdd|inRes=', inRes)
			/*
 notesAdd|inRes= notes {
  dataValues: {
    shared: null,
    id: 5,
    user_id: '1',
    note_text: 'dgdfgdfgdfg',
    updatedAt: 2020-08-05T20:56:26.513Z,
    createdAt: 2020-08-05T20:56:26.513Z
  },
  _previousDataValues: {
    user_id: '1',
    note_text: 'dgdfgdfgdfg',
    id: 5,
    shared: null,
    createdAt: 2020-08-05T20:56:26.513Z,
    updatedAt: 2020-08-05T20:56:26.513Z
  },
  _changed: Set(0) {},
  _options: { isNewRecord: true, _schema: null, _schemaDelimiter: '' },
  isNewRecord: false
}			 */

		} catch (error) {
			console.error('notesAdd|insertNote|error=', error)
			return {
				status: 'error',
				// line  : __fili,
			}
		}

		if (!inRes) {
			return {
				status: 'error',
				// line  : __fili,
			}
		}
		if (!inRes.dataValues) {
			return {
				status: 'error',
				// line  : __fili,
			}
		}

		inRes.dataValues.status = 'ok'

		return inRes.dataValues
	}
}

const ClsNotes = new Notes();
module.exports = ClsNotes