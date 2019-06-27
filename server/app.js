var Koa = require('koa');
var cors = require('koa-cors');
var bodyParser = require('koa-bodyparser');


const router = require('./routers/index');

const MogoModule = require('./models/mongodb');






const app = new Koa();



app.use(cors());
app.use(bodyParser());

app.use(async (ctx, next) => {
  await next();
  const rt = ctx.response.get('X-Response-Time');
  console.log(`${ctx.method} ${ctx.url} - ${rt}`);
});

// x-response-time

app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  ctx.set('X-Response-Time', `${ms}ms`);
});

app
  .use(router.routes())
  .use(router.allowedMethods());

module.exports = app;