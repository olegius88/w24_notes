const isDebug = process.env.IN_WORKS !== undefined;
require('./Mg');

const crypto = require('crypto');
const hashEquals = require('hash-equals');
const hash = require('hash.js');
const hasher = require('wordpress-hash-node');

const substr = require('locutus/php/strings/substr');

const moment = require('moment');
const db = require('./Db');
const Api = require('./Api');

let MINUTE_IN_SECONDS = 60;
let HOUR_IN_SECONDS = 60 * MINUTE_IN_SECONDS;
let DAY_IN_SECONDS = 24 * HOUR_IN_SECONDS;
let WEEK_IN_SECONDS = 7 * DAY_IN_SECONDS;
let MONTH_IN_SECONDS = 30 * DAY_IN_SECONDS;
let YEAR_IN_SECONDS = 365 * DAY_IN_SECONDS;
const LOGGED_IN_KEY = '#IaxFz|;V>0jRaiNP/uon[I}j=';
const LOGGED_IN_SALT = 'Ya>0FuXS/},@)[';

let COOKIE_HOSTS = {};


/**
 * Работа с авторизацией
 */
class Auth {

  constructor() {

    // Массив хостов для привязки авторизации
    let host_mass = [
      'http://127.0.0.1',
      'https://127.0.0.1',
    ];

    host_mass.forEach(function (item) {
      let host_md5 = crypto.createHash('md5').update(item).digest('hex');
      COOKIE_HOSTS[item] = {
        COOKIEHASH        : host_md5,
        AUTH_COOKIE       : 'wordpress_' + host_md5,
        SECURE_AUTH_COOKIE: 'wordpress_sec_' + host_md5,
        LOGGED_IN_COOKIE  : 'wordpress_logged_in_' + host_md5,
        USER_COOKIE       : 'wordpressuser_' + host_md5,
        PASS_COOKIE       : 'wordpresspass_' + host_md5,
      }
    });

  }

  wp_generate_password(length, special_chars, extra_special_chars = false) {
    let chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    if (special_chars === true)
      chars += '!@#$%^&*()';
    if (extra_special_chars === true)
      chars += '-_ []{}<>~`+=,.;:/?|';

    if (typeof length === 'undefined') length = 12;

    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }


  /**
   * Проверка авторизации
   */
  async loggedIn(req){

    if (!req.hostname) {
      return {
        status : 'error',
        msg: 'host undefined',
        line  : __fili,
      };
    }

    let host = `https://${req.hostname}`;
    console.log('logged_in|host=', host)

    if (!COOKIE_HOSTS.hasOwnProperty(host)) {
      return {
        status : 'error',
        msg: 'Необходимо авторизоваться',
        line  : __fili,
      };
    }

    if (!req.cookies[COOKIE_HOSTS[host].LOGGED_IN_COOKIE]) {
      return {
        status: 'cookies_not_found',
        msg: 'Необходимо авторизоваться',
        line  : __fili,
      }
    }

    let auth_cookies = req.cookies[COOKIE_HOSTS[host].LOGGED_IN_COOKIE];
    let cookie_elements = auth_cookies.split('|');
    if (cookie_elements.length !== 4) {
      return {
        status: 'cookies_not_found',
        msg: 'Необходимо авторизоваться',
        line  : __fili,
      }
    }

    let username = decodeURIComponent(cookie_elements[0]).replace(/\+/g, " ");
    let expiration = cookie_elements[1];
    let token = cookie_elements[2];
    let hmac = cookie_elements[3];

    // проверяем время жизни куки, если истекло - прерываем скрипт
    if (expiration < moment().unix()) {
      return {
        status: 'cookies_not_found',
        res: 1,
        msg: 'Необходимо авторизоваться',
        line  : __fili,
      }
    }

    let fRes
    try {
      fRes = await db.Users.findOne({where: {email: username}, raw: true})
      // console.log('logged_in|fRes=', fRes)
      /*
logged_in|fRes= {
  id: 1,
  email: 'sh.oleg@list.ru',
  password: '$P$BMJLSW31Nq88v53jARLYJ7wZlwYHV6.',
  session_tokens: null,
  api_token: null,
  api_token_add_date: null,
  api_token_end_date: null,
  api_token_end_unix_time: null,
  createdAt: 2020-08-05T21:17:41.000Z,
  updatedAt: 2020-08-05T21:18:09.000Z
}       */

    } catch (error) {
      console.error('logged_in|error=', error)
      return {
        status: 'error',
        msg: 'Ошибка в получении данных',
        line  : __fili,
      }
    }

    if (!fRes) {
      return {
        status: 'not_found',
        msg: 'Пользователь не найден',
        line  : __fili,
      }
    }


    const pass_frag = substr(fRes.password, 8, 4);
    const key = this.wp_hash(`${username}|${pass_frag}|${expiration}|${token}`);

    const algo = 'sha256'; //function_exists('hash') ? 'sha256' : 'sha1';
    const hash = this.hash_hmac(algo, username + '|' + expiration + '|' + token, key);

    // хеш код из куки не совпал с вычисленным - прерываем скрипт
    if (!hashEquals(hash, hmac)) {
      return {
        status: 'hash_error',
        msg: 'hash error',
        line  : __fili,
      }
    }

    const user_options = {};
    let sessions = [];
    try {
      sessions = JSON.parse(fRes.session_tokens);

    } catch (error) {
      console.error({user_options, fRes, error});
      return {
        status: 'error',
        msg: 'parse session tokens error',
        line  : __fili,
      }
    }

    const verifier = this.hash_token(token);

    // сессия не найдена или устарела - прерываем скрипт
    if (sessions && sessions[verifier]) {
      if (sessions[verifier]['expiration'] < moment().unix()) {
        return {
          status: 'hash_error',
          msg: 'expiration verifier error 1',
          line  : __fili,
        }
      }
    } else {
      return {
        status: 'hash_error',
        msg: 'expiration verifier error 2',
        line  : __fili,
      }
    }

    return {
      status: 'ok',
      line  : __fili,
      id    : fRes.id,
      email : fRes.email,

      sessions_data: {
        sessions: sessions,
        verifier: verifier
      },
    }
  }


  /**
   * Авторизация пользователя
   */
  async userLogin(data){
    // console.log('userLogin|data=', data)
    /*
userLogin|data= {
  hostname: '127.0.0.1',
  email: 'sh.oleg@list.ru',
  password: '1212',
  rememberme: undefined,
  ip: '::ffff:127.0.0.1',
  user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:80.0) Gecko/20100101 Firefox/80.0'
}     */

    if (!data.hostname) {
      return {
        status: 'error',
        msg: 'hostname incorrect',
        line  : __fili,
      }
    }
    if (!data.email) {
      return {
        status: 'error',
        msg: 'email incorrect',
        line  : __fili,
      }
    }
    if (!data.password) {
      return {
        status: 'error',
        msg: 'password incorrect',
        line  : __fili,
      }
    }

    const host = `https://${data.hostname}`

    if (!COOKIE_HOSTS.hasOwnProperty(host)) {
      return {
        status: 'error',
        msg: 'host not found',
        line  : __fili,
      }
    }

    const email = data.email;
    const password = data.password;
    const rememberme = data.rememberme;

    if (!email || !password) {
      return {
        status: 'error',
        msg: 'Введите логин и пароль',
        line  : __fili,
      }
    }

    let fRes
    try {
      fRes = await db.Users.findOne({where: {email: email}, raw: true})
      console.log('userLogin|fRes=', fRes)

    } catch (error) {
      console.error('userLogin|error=', error)
      return {
        status: 'error',
        msg: 'Ошибка в получении данных',
        line  : __fili,
      }
    }

    if (!fRes) {
      return {
        status: 'not_found',
        msg: 'Пользователь не найден',
        line  : __fili,
      }
    }

    if (!ClsAuth.checkPassword(password, fRes.password)) {
      return {
        status: 'credential_error',
        msg: 'Пароль не верен.',
        line  : __fili,
      }
    }

    const ut = moment().unix();
    let expiration = ut + YEAR_IN_SECONDS;
    if (rememberme === 1) {
      expiration = ut + YEAR_IN_SECONDS;
    }

    const token = ClsAuth.wp_generate_password(43, false, false);
    const verifier = ClsAuth.hash_token(token);
    const session = {};
    session['expiration'] = expiration;

    if (data.ip) session['ip'] = data.ip;
    if (data.user_agent) session['ua'] = data.user_agent;
    session['login'] = ut;

    let sessions = {};
    // console.log('userLogin|session=', session)
    sessions[verifier] = session;
    // console.log('userLogin|sessions=', sessions)
    const sessionTokens = JSON.stringify(sessions);
    // console.log('userLogin|sessionTokens=', sessionTokens)

    let updRes
    try {
      updRes = await db.Users.update({session_tokens: sessionTokens}, {where: {id: fRes.id}, raw: true})
      console.log('userLogin|update|updRes=', updRes)

    } catch (error) {
      console.error('userLogin|update|error=', error)
      return {
        status: 'error',
        line  : __fili,
      }
    }

    const pass_frag = substr(fRes.password, 8, 4);
    const key = ClsAuth.wp_hash(`${fRes.email}|${pass_frag}|${expiration}|${token}`);
    const algo = 'sha256';
    const hash = ClsAuth.hash_hmac(algo, `${fRes.email}|${expiration}|${token}`, key);
    const cookie = `${fRes.email}|${expiration}|${token}|${hash}`;

    const cookies = {
      cookie1 : {
        name: COOKIE_HOSTS[host].LOGGED_IN_COOKIE,
        value: cookie,
        params: {
          domain: data.host,
          path: '/',
          expires: new Date(Date.now() + YEAR_IN_SECONDS * 1000),
          httpOnly: true,
          secure: true
        }
      }
    }

    return {
      status: 'ok',
      cookies: cookies,
      line  : __fili,
    }
  }


  /**
   * Сверка паролей
   *
   * @param pass1
   * @param pass2
   * @returns {boolean}
   */
  checkPassword(pass1, pass2) {
    return hasher.CheckPassword(pass1, pass2)
  }


  /**
   * Выход
   */
  async logout(req, res) {

    // Проверка авторизации
    const aRes = await this.loggedIn(req)
    // console.log('logout|aRes=', aRes);
    /*
logout|aRes= {
  status: 'ok',
  id: 1,
  email: 'sh.oleg@list.ru',
  sessions_data: {
    sessions: {
      '39559a5bc36613f4e4ffbe42c42a0841aa3a41e564edea3f8027900efec85268': [Object]
    },
    verifier: '39559a5bc36613f4e4ffbe42c42a0841aa3a41e564edea3f8027900efec85268'
  }
}    */

    // Удаление данных токена
    delete Api.validTokens[aRes.id.toString()]

    if (!aRes.sessions_data.sessions[aRes.sessions_data.verifier]) {
      return {
        status: 'ok',
      }
    }

    delete aRes.sessions_data.sessions[aRes.sessions_data.verifier];

    const host = `https://${req.hostname}`

    // Auth cookies
    res.cookie(COOKIE_HOSTS[host].AUTH_COOKIE, ' ', {expires: new Date(Date.now() - YEAR_IN_SECONDS)});
    res.cookie(COOKIE_HOSTS[host].SECURE_AUTH_COOKIE, ' ', {expires: new Date(Date.now() - YEAR_IN_SECONDS)});
    res.cookie(COOKIE_HOSTS[host].LOGGED_IN_COOKIE, ' ', {expires: new Date(Date.now() - YEAR_IN_SECONDS)});

    // Settings cookies
    res.cookie('wp-settings-' + aRes.id, ' ', {expires: new Date(Date.now() - YEAR_IN_SECONDS)});
    res.cookie('wp-settings-time-' + aRes.id, ' ', {expires: new Date(Date.now() - YEAR_IN_SECONDS)});

    // Even older cookies
    res.cookie(COOKIE_HOSTS[host].USER_COOKIE, ' ', {expires: new Date(Date.now() - YEAR_IN_SECONDS)});
    res.cookie(COOKIE_HOSTS[host].PASS_COOKIE, ' ', {expires: new Date(Date.now() - YEAR_IN_SECONDS)});

    // Post password cookie
    res.cookie('wp-postpass_' + COOKIE_HOSTS[host].COOKIEHASH, ' ', {expires: new Date(Date.now() - YEAR_IN_SECONDS)});

    const qu = {
      // session_tokens: JSON.stringify(aRes.sessions_data.sessions),
      api_token              : null,
      api_token_end_unix_time: null,
      api_token_end_date     : null,
      api_token_add_date     : null,
      // сессия для браузера
      session_tokens: null,
    }
    let updRes
    try {
      updRes = await db.Users.update(qu, {where: {id: aRes.id}, raw  : true })
      // console.log('logout|update|updRes=', updRes)

    } catch (error) {
      console.error('logout|update|error=', error)
      return {
        status: 'error',
        line  : __fili,
      }
    }

    return {
      status: 'ok',
    }
  }


  /**
   * Добавление пользователя
   */
  async userCreate(data) {
    // console.log('userCreate|data=', data)

    if (!data.email) {
      return {
        status: 'error',
        msg   : 'email data incorrect',
        line  : __fili,
      }
    }
    data.email = data.email.trim();

    if (!data.password) {
      return {
        status: 'error',
        msg   : 'password data incorrect',
        line  : __fili,
      }
    }

    const eeRes = await ClsAuth.emailExists(data.email)
    // console.log('userCreate|eeRes=', eeRes)
    /*
 userCreate|eeRes= {
  status: 'ok',
  line: 'F:\\phpstorm\\projects\\w24_notes\\Auth.js:569',
  res: {
    id: 1,
    email: 'sh.oleg@list.ru',
    password: '$P$BMJLSW31Nq88v53jARLYJ7wZlwYHV6.',
    session_tokens: null,
    api_token: null,
    api_token_add_date: null,
    api_token_end_date: null,
    api_token_end_unix_time: null,
    createdAt: 2020-08-05T21:17:41.000Z,
    updatedAt: 2020-08-05T22:18:41.000Z
  }
}     */
    if (eeRes.status == 'error') {
      return eeRes;
    }
    if (eeRes.status == 'ok' && eeRes.res) {
      return {
        status: 'email_exists',
        data  : eeRes.res,
        line  : __fili,
      }
    }

    const insertUser = db.Users.build({email: data.email, password: hasher.HashPassword(data.password),});

    let inRes
    try {
      inRes = await insertUser.save();
      // console.log('userCreate|res=', res)
      /*
 userCreate|res= users {
  dataValues: {
    add_date: Literal { val: 'CURRENT_TIMESTAMP' },
    upd_date: Literal { val: 'CURRENT_TIMESTAMP' },
    id: 1,
    email: 'sh.oleg@list.ru',
    updatedAt: 2020-08-04T12:08:26.812Z,
    createdAt: 2020-08-04T12:08:26.812Z
  },
  _previousDataValues: {
    email: 'sh.oleg@list.ru',
    id: 1,
    add_date: Literal { val: 'CURRENT_TIMESTAMP' },
    upd_date: Literal { val: 'CURRENT_TIMESTAMP' },
    createdAt: 2020-08-04T12:08:26.812Z,
    updatedAt: 2020-08-04T12:08:26.812Z
  },
  _changed: Set(0) {},
  _options: { isNewRecord: true, _schema: null, _schemaDelimiter: '' },
  isNewRecord: false
}      */

    } catch (error) {
      console.error('userCreate|insertUser|error=', error)
      return {
        status: 'error',
        line  : __fili,
      }
    }

    if (!inRes) {
      return {
        status: 'error',
        line  : __fili,
      }
    }
    if (!inRes.dataValues) {
      return {
        status: 'error',
        line  : __fili,
      }
    }

    return {
      status: 'ok',
      data  : inRes.dataValues,
      line  : __fili,
    }
  }


  /**
   * Проверка существования email
   * @param email
   */
  async emailExists(email) {

    let res
    try {
      res = await db.Users.findOne({where: {email: email}, raw: true})
      // console.log('emailExists|res=', res)
      /*
emailExists|res= {
  id: 1,
  email: 'sh.oleg@list.ru',
  password: '$P$BMJLSW31Nq88v53jARLYJ7wZlwYHV6.',
  session_tokens: null,
  api_token: null,
  api_token_add_date: null,
  api_token_end_date: null,
  api_token_end_unix_time: null,
  createdAt: 2020-08-05T21:17:41.000Z,
  updatedAt: 2020-08-05T22:18:41.000Z
}       */

    } catch (error) {
      console.error('emailExists|error=', error)
      return {
        status: 'error',
        line  : __fili,
      }
    }

    return {
      status: 'ok',
      line  : __fili,
      res   : res,
    }
  }


  /**
   * Генератор пароля
   * @param len
   * @returns {string|string}
   */
  passwordGenerate(len){
    let password = "";
    const symbols = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < len; i++){
      password += symbols.charAt(Math.floor(Math.random() * symbols.length));
    }
    return password;
  }


  hash_token(token) {
    return hash.sha256().update(token).digest('hex');
  }

  hash_hmac(algo, string, key) {
    const hmac = crypto.createHmac(algo, key);
    hmac.update(string);
    return hmac.digest('hex');
  }
  wp_hash(string) {
    const key = LOGGED_IN_KEY + LOGGED_IN_SALT;
    return this.hash_hmac('md5', string, key);
  }
}

const ClsAuth = new Auth();
module.exports = ClsAuth;