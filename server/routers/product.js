var router = require('koa-router')();
const MogoModule = require('../models/mongodb');

router.get('/', async (ctx, next) => {
  // 查询全部产品信息
  let products = [];
  await MogoModule.Product.find()
    .then(res => {
       console.log(res)
      products = res;
    })
    .catch(err => {
      console.log(err)
    })
  ctx.body = products;
})

router.get('/:key', async (ctx, next) => {
  // 查询全部产品信息
  console.log(ctx.params);
  let productkey = ctx.params.key;
  let products = {};
  await MogoModule.Product.find({ productkey: productkey })
    .then(async detail => {
      console.log(detail)
      products.detail = detail;
      return await MogoModule.Topic.find({ productkey: productkey })
    })
    .then(async topics => {
      console.log(topics)
      products.topics = topics;
      return await MogoModule.Functions.find({ productkey: productkey })
    })
    .then(functions => {
      console.log(functions);
      products.functions = functions;
    })
    .catch(err => {
      console.log(err)
    })
  ctx.body = products;
})

router.post('/', async (ctx, next) => {
  let data = ctx.request.body;
  console.log(data)
  var product = new MogoModule.Product(data);
  product.save(function (err, fluffy) {
    if (err) {
      console.error(err);
      return;
    }
  })

  const ProductKey = data.productkey;

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
    .then(res => {
      return topic_error.save();
    })
    .then(res => {
      return topic_get.save();
    })
    .catch(err => {
      console.error(err);
    })

  // var topic = new MogoModule.Topic(topic_data);
  // 查询全部产品信息
  let products = [];
  await MogoModule.Product.find()
    .then(res => {
      // console.log(res)
      products = res;
    })
    .catch(err => {
      console.log(err)
    })
  ctx.body = products;
});


router.delete('/:key', async (ctx, next) => {
  let productkey = ctx.params.key;
  console.log(productkey);
  await MogoModule.Product.deleteOne({productkey: productkey})
  .then(async res => {
    console.log(res);
    await MogoModule.Topic.deleteMany({productkey: productkey})
  })
  .then(async res => {
    console.log(res);
    await MogoModule.Functions.deleteMany({productkey: productkey})
  })
  .then(async res => {
    console.log(res);
    return await MogoModule.Device.deleteMany({productkey: productkey})
  })
  .then(async res => {
    console.log(res)
    return await MogoModule.DeviceTopic.deleteMany({productkey: productkey})
  })
  .then( async res => {
    console.log(res)
    return await MogoModule.DeviceValue.deleteMany({productkey: productkey})
  })
  .then(res => {
    console.log(res)
  })
  .catch(err => {
    console.error(err);
    ctx.body = {errmsg: err, errcode:0};
  })
  ctx.body = {errmsg:'ok',errcode:0};
})



router.post('/function', async (ctx, next) => {
  let data = ctx.request.body;
  console.log(data)
  let key = data.productkey;
  var functions = new MogoModule.Functions(data);
  let topic = [];

  await functions.save(data)
    .then(async res => {
      console.log(res)
    })
    .catch(err => {
      console.error(err);
    })

  let functions_data = [];
  await MogoModule.Functions.find({ productkey: key }, { _id: 0, __v: 0 })
    .then(res => {
      console.log(res)
      functions_data = res;
    })
    .catch(err => {
      console.log(err)
    })

  ctx.body = functions_data;
});



module.exports = router;