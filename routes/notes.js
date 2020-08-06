const express = require('express');
const router = express.Router();
const db = require('../Db');
const Auth = require('./../Auth');
const Notes = require('./../Notes');


/*
Список заметок
 */
router.get('/', async function(req, res, next) {

  // Список заметок для браузера
  const nbRes = await Notes.notesBrowser(req)
  // console.log('notes|nbRes=', nbRes)
  /*
notes|nbRes= {
  status: 'ok',
  showForward: true',
  notes: [
    {
      id: 5,
      user_id: 1,
      shared: null,
      note_text: 'dgdfgdfgdfg',
      createdAt: 2020-08-06T04:35:37.000Z,
      updatedAt: 2020-08-06T04:35:37.000Z
    },
    {
      id: 4,
      user_id: 1,
      shared: null,
      note_text: 'dgdfgdfgdfg',
      createdAt: 2020-08-06T04:35:36.000Z,
      updatedAt: 2020-08-06T04:35:36.000Z
    }
  ]
}   */

  if (nbRes.status != 'ok') {
    return res.redirect('/');
  }

  res.render('notes', {
    title     : 'Notes',
    notes     : nbRes.notes,
    pageNum   : 1,
    showForward : nbRes.showForward,
  });
});


/*
Список заметок - пагинация
 */
router.get('/page/:page_id(\\d+)', async function(req, res, next) {
  console.log('notes|page_id=', req)

  // Список заметок для браузера
  const nbRes = await Notes.notesBrowser(req)
  // console.log('notes|page_id|nbRes=', nbRes)
  /*
notes|nbRes= {
  status: 'ok',
  notes: [
    {
      id: 5,
      user_id: 1,
      shared: null,
      note_text: 'dgdfgdfgdfg',
      createdAt: 2020-08-06T04:35:37.000Z,
      updatedAt: 2020-08-06T04:35:37.000Z
    },
    {
      id: 4,
      user_id: 1,
      shared: null,
      note_text: 'dgdfgdfgdfg',
      createdAt: 2020-08-06T04:35:36.000Z,
      updatedAt: 2020-08-06T04:35:36.000Z
    }
  ]
}   */

  if (nbRes.status != 'ok') {
    return res.redirect('/');
  }

  if (parseInt(req.params.page_id) === 1) {
    return res.redirect('/notes');
  }

  if (nbRes.notes.length === 0) {
    res.status(404)
  }

  res.render('notes', {
    title     : 'Список заметок',
    notes     : nbRes.notes,
    pageNum   : req.params.page_id,
    showForward : nbRes.showForward,
  });
})


/*
Просмотр заметки
 */
router.get('/:note_id(\\d+)', async function(req, res, next) {

  const nbRes = await Notes.noteSharedBrowser(req)
  console.log('notes|nbRes=', nbRes)
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

  if (nbRes.status != 'ok'){
    return res.render('error', {title: 'Просмотр заметки', message: 'Заметка не доступна',});
  }

  res.render('note', {
    title   : 'Просмотр заметки',
    note    : nbRes.note,
    noteId  : req.params.note_id,
  });
});


/*
Редактировать заметку
 */
router.get('/add', async function(req, res, next) {

  // Проверка авторизации
  const lRes = await Auth.loggedIn(req)
  // console.log('authenticate|aRes=', aRes);

  if (lRes.status == 'error') {
    return res.render('error', {title: 'Notes', message: lRes.msg,});
  }
  if (lRes.status != 'ok') {
    return res.redirect('/');
  }

  res.render('note_add', {
    title  : 'Добавить заметку',
    btnText: 'Добавить',
  });
});


/*
Добавление заметки
 */
router.post('/add', async function(req, res, next) {
  // console.log('notes|req=', req)

  // Редактирование заметки для браузера
  const enRes = await Notes.addNoteBrowser(req)
  console.log('notes|add=', enRes)

  if (enRes.status != 'ok') {
    return res.json(enRes);
  }

  return res.json({status: 'ok', note_id: enRes.id});
})


/*
Редактировать заметку
 */
router.get('/edit/:note_id(\\d+)', async function(req, res, next) {

  const nbRes = await Notes.noteBrowser(req)
  console.log('notes|nbRes=', nbRes)
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

  if (nbRes.status != 'ok'){
    return res.render('error', {title: 'Редактирование заметки', message: nbRes.msg,});
  }

  res.render('note_edit', {
    title   : 'Редактирование заметки',
    note    : nbRes.note,
    btnText : 'Редактировать',
    noteId  : req.params.note_id,
    hostname: `${req.hostname}:3000`,
  });
});


/*
Сохранение заметки
 */
router.post('/edit/:note_id(\\d+)', async function(req, res, next) {
  // console.log('notes|req=', req)

  // Редактирование заметки для браузера
  const enRes = await Notes.editNoteBrowser(req)
  console.log('notes|enRes=', enRes)

  if (enRes.status != 'ok') {
    return res.json(enRes);
  }

  return res.json({status: 'ok',});
})


/*
Удаление заметки
 */
router.post('/remove/:note_id(\\d+)', async function(req, res, next) {
  // console.log('notes|req=', req)

  // Редактирование заметки для браузера
  const enRes = await Notes.removeNoteBrowser(req)
  console.log('notes|enRes=', enRes)

  if (enRes.status != 'ok') {
    return res.json(enRes);
  }

  return res.json({status: 'ok',});
})


module.exports = router;
