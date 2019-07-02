var router = require('koa-router')();
const MogoModule = require('../models/mongodb');
const { getToken } = require('../utils');


router.post('/login', async (ctx, next) => {
  const data = ctx.request.body;
  console.log(data);
  let user = await MogoModule.User.find({ username: data.username });
  if (user.length > 0) {
    console.log(user);
    ctx.body = {
      ok: true,
      msg: '登录成功',
      token: getToken({ username: data.username, password: data.password })
    }
  } else {
    ctx.body = {
      ok: false,
      msg: '登录失败'
    }
  }
});




module.exports = router;



