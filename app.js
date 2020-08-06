require('console-stamp')(console, {
  metadata: function () {
    const orig              = Error.prepareStackTrace;
    Error.prepareStackTrace = function(_, stack){ return stack; };
    const err = new Error;
    Error.captureStackTrace(err, arguments.callee);
    const stack             = err.stack;
    Error.prepareStackTrace = orig;
    return ('['+stack[1].getFileName()+':'+stack[1].getLineNumber()+']'+'\n');
  },
  colors: {
    stamp: 'yellow',
    label: 'white',
    metadata: 'green'
  },
  // exclude: isDebug || isLocalProduct ? [] : ["log", "info", "warn", "error", "dir", "assert"],
});
require('./Mg');
//console.log('__fili: ' + __fili);
//console.log('__file: ' + __file);
//console.log('__ext: ' + __ext);
//console.log('__base: ' + __base);
//console.log('__filename: ' + __filename);
//console.log('__dirname: ' + __dirname);
//console.log('__func: ' + __func);


const createError = require('http-errors');
const express    = require('express');
const path         = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const bodyParser = require('body-parser');



const db = require('./Db');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const notesRouter = require('./routes/notes');
const addUserRouter = require('./routes/add_user');
const apiRouter = require('./routes/api');

const app = express();

const urlencodedParser = bodyParser.urlencoded({extended: false});

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'twig');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(bodyParser.json({/*limit: "50mb",*/ extended: true}));
app.use(bodyParser.urlencoded({/*limit: "50mb",*/ extended: true}))
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/notes', notesRouter);
app.use('/add_user', addUserRouter);
app.use('/api', apiRouter);


// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});
// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

(async () => {

  // синхронизация с бд, после успешной синхронизации запускаем сервер
  try {
    await db.sequelize.sync()
  } catch (error) {
    console.error(error)
    return
  }

  app.listen(3000, function(){
    console.log("Сервер ожидает подключений на порту 3000");
  });
})();



