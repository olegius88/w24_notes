const {checkPassword, userLogin, userCreate} = require('./../Auth');

test('сравнение пароля и его хеша', () => {
	expect(checkPassword('1212', '$P$BMJLSW31Nq88v53jARLYJ7wZlwYHV6.')).toBeTruthy()
});

const p = {
	hostname: '127.0.0.1',
	email: 'sh.oleg@list.ru',
	password: '1212',
}

test('регистрация пользователя через браузер', async () => {

	expect(await userCreate(p)).toMatchObject({status: expect.stringMatching(/email_exists|ok/),})
});

test('авторизация через браузер', async () => {

	expect(await userLogin(p)).toHaveProperty('status', 'ok')
});
