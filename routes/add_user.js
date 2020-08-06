const express = require('express');
const router = express.Router();
const Auth = require('./../Auth');
const { body, validationResult } = require('express-validator');

/* GET home page. */
router.get('/', async function (req, res, next) {


  const aRes = await Auth.loggedIn(req)
  console.log('authenticate|aRes=', aRes);

  if (aRes.status == 'error') {
    return res.render('error', {title: 'Notes', message: aRes.msg,});
  }

  if (aRes.status == 'ok') {
    return res.redirect('/notes');
  }

  res.render('add_user', {title: 'Notes'});
});


/*  */
router.post('/', async function(req, res, next) {
  // console.log('authenticate|req=', req);



  if (req.body.email) {

  }
  if (req.body.psw1) {

  }

  // Добавление пользователя
  const ucRes = await Auth.userCreate({
    email   : req.body.inputEmail,
    password: req.body.inputPassword,
  })
  console.log('authenticate|ucRes=', ucRes);

  if (ucRes.status == 'error') {
    return res.render('error', {title: 'Notes', message: ucRes.msg,});
  }

  // Авторизация пользователя
  const lRes = await Auth.userLogin({
    hostname  : req.hostname,
    email     : req.body.inputEmail,
    password  : req.body.inputPassword,
    rememberme: req.body.rememberme,
    ip        : req.ip,
    user_agent: req.headers['user-agent'],
  })
  console.log('authenticate|lRes=', lRes);

  if (lRes.status != 'ok') {
    return res.render('error', {title: 'Notes', message: lRes.msg,});
  }

  res.cookie(lRes.cookies.cookie1.name, lRes.cookies.cookie1.value, lRes.cookies.cookie1.params);
  res.render('auth_form', {title: 'Notes '});
});

module.exports = router;
