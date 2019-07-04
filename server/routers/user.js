const crypto = require('crypto');
var router = require('koa-router')();

const MogoModule = require('../models/mongodb');
const { getToken } = require('../utils');



router.post('/register', async (ctx, next) => {
  let user = ctx.request.body;
  console.log(user);
  const secret = 'abcdefg';
  const hashpassword = crypto.createHmac('sha256', secret)
                   .update(user.password)
                   .digest('hex');
  user.password = hashpassword;
  const userModel = new MogoModule.User(user);
  let result = await userModel.save();
  console.log(result);
  ctx.body = result;
});


router.post('/login', async (ctx, next) => {
  const data = ctx.request.body;
  const secret = 'abcdefg';
  const hashpassword = crypto.createHmac('sha256', secret)
                   .update(data.password)
                   .digest('hex');
  console.log(data);
  console.log(hashpassword)
  let result = await MogoModule.User.find({ username: data.username, password: hashpassword });
  if (result.length > 0) {
    console.log(result);
    ctx.body = {
      ok: true,
      msg: '登录成功',
      username: result[0].username,
      token: getToken({ username: result[0].username, password: result[0].password })
    }
  } else {
    ctx.body = {
      ok: false,
      msg: '登录失败'
    }
  }
});




module.exports = router;



