const express = require('express');
const router = express.Router();
const Auth = require('./../Auth');

/* GET home page. */
router.get('/', async function (req, res, next) {

  // Проверка авторизации
  const lRes = await Auth.loggedIn(req)
  // console.log('authenticate|aRes=', aRes);

  if (lRes.status == 'error') {
    return res.render('error', {title: 'Notes', message: lRes.msg,});
  }
  if (lRes.status != 'ok') {
    return res.render('auth_form', {title: 'Notes'});
  }

  // res.render('auth_form', {title: 'Notes'});
  res.redirect('/notes');
});


/* GET home page. */
router.post('/', async function(req, res, next) {

  const aRes = await Auth.loggedIn(req)
  console.log('authenticate|aRes=', aRes);

  if (aRes.status == 'ok') {
    return res.redirect('/');
  }

  // console.log('authenticate|req=', req.body);

  // Добавление пользователя
  const ucRes = await Auth.userCreate({
    email   : req.body.inputEmail,
    password: req.body.inputPassword,
  })
  // console.log('authenticate|ucRes=', ucRes);

  if (ucRes.status == 'error') {
    return res.render('error', {title: 'Notes', message: ucRes.msg,});
  }

  // Авторизация пользователя
  const lRes = await Auth.userLogin({
    hostname  : req.hostname,
    email     : req.body.inputEmail,
    password  : req.body.inputPassword,
    rememberme: req.query.rememberme,
    ip        : req.ip,
    user_agent: req.headers['user-agent'],
  })
  // console.log('authenticate|lRes=', lRes);

  if (lRes.status != 'ok') {
    return res.render('error', {title: 'Notes', message: lRes.msg,});
  }

  res.cookie(lRes.cookies.cookie1.name, lRes.cookies.cookie1.value, lRes.cookies.cookie1.params);
  return res.redirect('/');
});


/*
Разлогин пользователя со сбросом всех сессий пользователя
 */
router.get('/logout', async function (req, res, next) {

  await Auth.logout(req, res)

  return res.redirect('/');
});

module.exports = router;
