const Koa = require('koa');
const cors = require('koa-cors');
const bodyParser = require('koa-bodyparser');
const jwt = require('koa-jwt');
const router = require('./routers/index');

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

const secret = 'secret';


/* 当token验证异常时候的处理，如token过期、token错误 */
app.use((ctx, next) => {
  return next().catch((err) => {
      if (err.status === 401) {
          ctx.status = 401;
          ctx.body = {
              ok: false,
              msg: err.originalError ? err.originalError.message : err.message
          }
      } else {
          throw err;
      }
  });
});



/* 路由权限控制 */
app.use(jwt({ secret: secret }).unless({
  // 设置login、register接口，可以不需要认证访问
  path: [
      /^\/user\/login/,
      /^\/user\/register/,
      /^\/webhook/,
      // /^((?!\/api).)*$/   // 设置除了私有接口外的其它资源，可以不需要认证访问
  ]
}));

app
  .use(router.routes())
  .use(router.allowedMethods());

module.exports = app;