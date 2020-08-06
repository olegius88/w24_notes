const express = require('express');
const router = express.Router();
const db = require('../Db');

/* GET users listing. */
router.get('/', async function(req, res, next) {


  try {
    const res = await db.Users.findAll({where:{}, raw: true })
    console.log(res)

  } catch (error) {
    console.error(error)
  }


  res.render('notes', {title: 'Notes'});
});

module.exports = router;
