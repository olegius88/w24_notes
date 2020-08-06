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

  // Добавление пользователя
  const ucRes = await Auth.userCreate({
    email   : req.body.email,
    password: req.body.psw1,
  })
  // console.log('authenticate|ucRes=', ucRes);

  if (ucRes.status == 'error') {
    return res.json(ucRes);
  }

  // Авторизация пользователя
  const lRes = await Auth.userLogin({
    hostname  : req.hostname,
    email     : req.body.email,
    password  : req.body.psw1,
    rememberme: req.body.rememberme,
    ip        : req.ip,
    user_agent: req.headers['user-agent'],
  })
  // console.log('authenticate|lRes=', lRes);

  if (lRes.status != 'ok') {
    return res.render('error', {title: 'Notes', message: lRes.msg,});
  }

  res.cookie(lRes.cookies.cookie1.name, lRes.cookies.cookie1.value, lRes.cookies.cookie1.params);
  res.json({status: 'ok', });
});

module.exports = router;
