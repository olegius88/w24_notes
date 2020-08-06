const {userCreate, userLogin} = require('./../Api');

const p = {
	email: 'sh.oleg@list.ru',
	password: '1212',
}

test('Регистрация пользователя через АПИ', async () => {

	expect(await userCreate(p)).toMatchObject({status: expect.stringMatching(/email_exists|ok/),})
});

let apiToken
let userId

test('Авторизация пользователя через АПИ', async () => {

	const ul = await userLogin(p)
	apiToken = ul.token
	userId = ul.user_id
	expect(ul).toHaveProperty('status', 'ok')
});