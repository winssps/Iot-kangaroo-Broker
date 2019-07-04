const router = require('koa-router')();
const MogoModule = require('../models/mongodb');
const { getJWTPayload } = require('../utils');

router.get('/', async (ctx, next) => {
  // 查询全部产品信息
  let payload = getJWTPayload(ctx.headers.authorization);
  console.log(payload)
  let products = await MogoModule.Product.find()
  ctx.body = products;
})

router.get('/:key', async (ctx, next) => {
  // 查询全部产品信息
  console.log(ctx.params);
  let productkey = ctx.params.key;
  let products = {};
  products.detail = await MogoModule.Product.find({ productkey: productkey })
  products.topics = await MogoModule.Topic.find({ productkey: productkey })
  products.functions = await MogoModule.Functions.find({ productkey: productkey })
  ctx.body = products;
})

router.post('/', async (ctx, next) => {
  let data = ctx.request.body;
  console.log(data)
  const ProductKey = data.productkey;
  let product = new MogoModule.Product(data);
  await product.save(data);

  const topic_str_update = `/${ProductKey}/\$\{deviceName\}/user/update`;
  const topic_str_error = `/${ProductKey}/\$\{deviceName\}/user/update/error`;
  const topic_str_get = `/${ProductKey}/\$\{deviceName\}/user/get`;

  var topics = [];

  var topicFun = function (productkey, describe, count, permission, topic) {
    this.productkey = productkey;
    this.describe = describe;
    this.count = count;
    this.topic = topic;
    this.permission = permission;
    this.getTopic = function () {
      var topic = {
        productkey: this.productkey,
        topic: this.topic,
        permission: this.permission,
        describe: this.describe,
        count: this.count
      }
      return new MogoModule.Topic(topic);
    }
  }

  var topic_update = new topicFun(ProductKey, '', 0, '发布', topic_str_update).getTopic();
  var topic_error = new topicFun(ProductKey, '', 0, '发布', topic_str_error).getTopic();
  var topic_get = new topicFun(ProductKey, '', 0, '订阅', topic_str_get).getTopic();


  console.log(topic_update, topic_error, topic_get);

  await topic_update.save()
  await topic_error.save();
  await topic_get.save();

  // var topic = new MogoModule.Topic(topic_data);
  // 查询全部产品信息
  let products = await MogoModule.Product.find()
  ctx.body = products;
});


router.delete('/:key', async (ctx, next) => {
  let productkey = ctx.params.key;
  console.log(productkey);
  await MogoModule.Product.deleteOne({ productkey: productkey })
  await MogoModule.Topic.deleteMany({ productkey: productkey })
  await MogoModule.Functions.deleteMany({ productkey: productkey })
  await MogoModule.Device.deleteMany({ productkey: productkey })
  await MogoModule.DeviceTopic.deleteMany({ productkey: productkey })
  await MogoModule.DeviceValue.deleteMany({ productkey: productkey })
  ctx.body = { errmsg: 'ok', errcode: 0 };
})



router.post('/function', async (ctx, next) => {
  let data = ctx.request.body;
  console.log(data)
  let key = data.productkey;
  let func = new MogoModule.Functions(data);
  await func.save(data)
  let functions_data = await MogoModule.Functions.find({ productkey: key }, { _id: 0, __v: 0 })
  ctx.body = functions_data;
});

module.exports = router;