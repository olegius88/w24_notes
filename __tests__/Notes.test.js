const moment = require('moment');
const Api = require('./../Api');

const {notesApiAdd, notesApiEdit, notesApiRemove} = require('./../Notes');



let apiToken
let userId
const p = {
	email: 'sh.oleg@list.ru',
	password: '1212',
}
let noteId

test('Добавление заметки', async () => {

	await Api.userCreate(p)
	const ul = await Api.userLogin(p)
	// console.log('ul=', ul)
	apiToken = ul.token
	userId = ul.user_id

	expect((notesApiAddObj = await notesApiAdd({
		user_id: userId,
		token: apiToken,
		note_text: `loren ipsum ${moment().unix()}`,

	}))).toMatchObject({status: expect.stringMatching(/ok/),})

	noteId = notesApiAddObj.id
});

test('Редактирование заметки', async () => {

	expect(await notesApiEdit({
		note_id: noteId,
		user_id: userId,
		token: apiToken,
		note_text: `edited loren ipsum ${moment().unix()}`,

	})).toMatchObject({status: expect.stringMatching(/ok/),})
});

test('Удаление заметки', async () => {

	expect(await notesApiRemove({
		note_id: noteId,
		user_id: userId,
		token: apiToken,
		note_text: `edited loren ipsum ${moment().unix()}`,

	})).toMatchObject({status: expect.stringMatching(/ok/),})
});