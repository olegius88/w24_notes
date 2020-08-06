const express = require('express');

const router = express.Router();

const Api = require('../Api');
const Notes = require('../Notes');


/*
Авторизация пользователя
 */
router.get('/auth', Api.auth);
router.post('/auth', Api.auth);


/*
Разлогин пользователя со сбросом всех сессий пользователя
 */
router.get('/logout',  async function(req, res, next) {
  const aRes = await Api.logout({
    user_id  : req.query.user_id,
    token    : req.query.token,
  })
  // delete aRes.line
  res.json(aRes)
});
router.post('/logout',  async function(req, res, next) {
  const aRes = await Api.logout({
    user_id  : req.query.user_id,
    token    : req.query.token,
  })
  // delete aRes.line
  res.json(aRes)
});


/*
Регистрация пользователя
 */
router.get('/reg', async function(req, res, next) {
  const ucRes = await Api.userCreate({
    email   : req.query.email,
    password: req.query.password,
  })
  // delete ucRes.line
  res.json(ucRes)
});
router.post('/reg', async function(req, res, next) {
  const ucRes = await Api.userCreate({
    email   : req.query.email,
    password: req.query.password,
  })
  // delete ucRes.line
  res.json(ucRes)
});


/*
Список заметок
 */
router.get('/notes', async function(req, res, next) {
  const nRes = await Notes.notesApi({
    user_id      : req.query.user_id,
    token        : req.query.token,
    page         : req.query.page,
    notes_on_page: req.query.notes_on_page,
  })
  // delete nRes.line
  res.json(nRes)
});


/*
Просмотр заметки
 */
router.get('/note/:note_id(\\d+)', async function(req, res, next) {
  const nRes = await Notes.noteApi({
    user_id      : req.query.user_id,
    token        : req.query.token,

    note_id: req.params.note_id,
  })
  // delete nRes.line
  res.json(nRes)
});


/*
Добавление заметки
 */
router.get('/notes/add', async function(req, res, next) {
  const naRes = await Notes.notesApiAdd({
    user_id  : req.query.user_id,
    token    : req.query.token,
    note_text: req.query.note_text,
  })
  // delete naRes.line
  res.json(naRes)
});
router.post('/notes/add', async function(req, res, next) {
  const naRes = await Notes.notesApiAdd({
    user_id  : req.query.user_id,
    token    : req.query.token,
    note_text: req.query.note_text,
  })
  // delete naRes.line
  res.json(naRes)
});


/*
Редактирование  заметки
 */
router.get('/notes/edit/:note_id(\\d+)', async function (req, res, next) {
  const naRes = await Notes.notesApiEdit({
    user_id   : req.query.user_id,
    token     : req.query.token,
    note_text : req.query.note_text,
    share_note: req.query.share_note,

    note_id: req.params.note_id,
  })
  // delete naRes.line
  res.json(naRes)
});
router.post('/notes/edit/:note_id(\\d+)', async function (req, res, next) {
  const naRes = await Notes.notesApiEdit({
    user_id   : req.query.user_id,
    token     : req.query.token,
    note_text : req.query.note_text,
    share_note: req.query.share_note,

    note_id: req.params.note_id,
  })
  // delete naRes.line
  res.json(naRes)
});


/*
Расшаривание заметки для неавторизованного пользователя
 */
router.get('/notes/share/:note_id(\\d+)', async function (req, res, next) {
  const naRes = await Notes.notesShare({
    user_id   : req.query.user_id,
    token     : req.query.token,
    share_note: true,

    note_id: req.params.note_id,
  })
  // delete naRes.line
  res.json(naRes)
});
router.post('/notes/share/:note_id(\\d+)', async function (req, res, next) {
  const naRes = await Notes.notesShare({
    user_id   : req.query.user_id,
    token     : req.query.token,
    share_note: true,

    note_id: req.params.note_id,
  })
  // delete naRes.line
  res.json(naRes)
});

/*
Закрытие расшаринной заметки для неавторизованного пользователя
 */
router.get('/notes/unshare/:note_id(\\d+)', async function (req, res, next) {
  const naRes = await Notes.notesShare({
    user_id: req.query.user_id,
    token  : req.query.token,
    note_id: req.params.note_id,
  })
  // delete naRes.line
  res.json(naRes)
});
router.post('/notes/unshare/:note_id(\\d+)', async function (req, res, next) {
  const naRes = await Notes.notesShare({
    user_id: req.query.user_id,
    token  : req.query.token,
    note_id: req.params.note_id,
  })
  // delete naRes.line
  res.json(naRes)
});


/*
Удаление заметки
 */
router.get('/notes/remove/:note_id(\\d+)', async function (req, res, next) {
  const naRes = await Notes.notesApiRemove({
    user_id   : req.query.user_id,
    token     : req.query.token,

    note_id: req.params.note_id,
  })
  // delete naRes.line
  res.json(naRes)
});
router.post('/notes/remove/:note_id(\\d+)', async function (req, res, next) {
  const naRes = await Notes.notesApiRemove({
    user_id   : req.query.user_id,
    token     : req.query.token,

    note_id: req.params.note_id,
  })
  // delete naRes.line
  res.json(naRes)
});


module.exports = router;
