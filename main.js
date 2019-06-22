var Koa = require('koa');
var Router = require('koa-router');
var cors = require('koa-cors');
var bodyParser = require('koa-bodyparser');
var mongoose = require('mongoose');

const MogoModule = require('./mongodb.js');


mongoose.connect('mongodb://localhost:27017/mqtt', { useNewUrlParser: true });


const app = new Koa();
var router = new Router();


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




router.post('/', async (ctx, next) => {
  console.log(ctx.request.body);
  let webhook = ctx.request.body;
  switch (webhook.action) {
    case 'client_connected':
      var { client_id, ipaddress, connected_at } = webhook;
      // console.log(client_id, ipaddress, connected_at, new Date(connected_at * 1000));
      await MogoModule.Device.updateOne({ device: client_id }, {
        ipaddress: ipaddress,
        // active_time: connected_at,
        last_time: new Date(connected_at * 1000),
        status: '已连接'
      })
      break;
    case 'message_publish':
      var { from_client_id, topic, payload, ts } = webhook;
      var payloadData = '';
      if (typeof payload == "string") {
        payloadData = JSON.parse(payload);
        console.log(payloadData)
      } else if (typeof payload == 'object') {
        payloadData = payload;
      }
      await MogoModule.DeviceTopic.find({ devicename: from_client_id, topic: topic })
        .then(async res => {
          console.log(res);
          return await MogoModule.DeviceValue.find({ devicename: from_client_id })
        })
        .then(async res => {
          console.log(res[0].deviceStatus)

          let statusDataArr = res[0].deviceStatus;
          for (payload_key in payloadData) {
            for (let i = 0; i < statusDataArr.length; i++) {
              if (statusDataArr[i].hasOwnProperty(payload_key)) {
                statusDataArr[i]['new_value'] = payloadData[payload_key];
              }
            }
          }
          return await MogoModule.DeviceValue.updateOne({ devicename: from_client_id }, { deviceStatus: statusDataArr })
        })
        .then(res => {
          console.log(res);
        })
        .catch(err => {
          console.error(err);
        })
      break;
    case 'client_disconnected':
      var { client_id } = webhook;
      await MogoModule.Device.updateOne({ device: client_id }, {
        status: '未连接'
      })
      break;
  }
})

router.get('/product', async (ctx, next) => {
  // 查询全部产品信息
  let products = [];
  await MogoModule.Product.find()
    .then(res => {
      //  console.log(res)
      products = res;
    })
    .catch(err => {
      console.log(err)
    })
  ctx.body = products;
})

router.get('/product/:key', async (ctx, next) => {
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

router.post('/product', async (ctx, next) => {
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


router.delete('/product/:key', async (ctx, next) => {
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

router.get('/device', async (ctx, next) => {
  let devices = [];
  await MogoModule.Device.find()
    .then(res => {
      // console.log(res)
      devices = res;
    })
    .catch(err => {
      console.log(err)
    })
  ctx.body = devices;
});

router.get('/device/:name', async (ctx, next) => {
  let deviceName = ctx.params.name;
  let devices = {};
  await MogoModule.Device.find({ device: deviceName }, { _id: 0, __v: 0 })
    .then(async res => {
      devices.detail = res;
      return await MogoModule.DeviceTopic.find({ devicename: deviceName }, { _id: 0, __v: 0 })
    })
    .then(async res => {
      devices.topic = res;
      return await MogoModule.DeviceValue.find({ devicename: deviceName }, { _id: 0, __v: 0 })
    })
    .then(res => {
      devices.value = res;
    })
    .catch(err => {
      console.log(err)
    })
  ctx.body = devices;
});

router.post('/device', async (ctx, next) => {
  let data = ctx.request.body;
  console.log(data)
  var device = new MogoModule.Device(data);
  await device.save()
    .then(res => {
      console.log(res);
    })
    .catch(err => {
      console.error(err);
    })

  let productkey = data.productkey;
  let deviceName = data.device;
  let topics = [];
  let DeviceValue = {
    productkey: productkey,
    devicename: deviceName,
    deviceStatus: []
  };

  await MogoModule.Topic.find({ productkey: productkey }, { _id: 0, __v: 0 })
    .then(async res => {
      console.log(res)
      topics = res.map(item => {
        let JsonDevice = JSON.stringify(item);
        let topic = Object.assign({ devicename: '' }, JSON.parse(JsonDevice));
        topic.topic = item.topic.replace(/\$\{deviceName\}/g, deviceName);
        topic.devicename = deviceName;
        return topic;
      })
      return await MogoModule.Functions.find({ productkey: productkey }, { _id: 0, __v: 0 })
    })
    .then(res => {
      console.log(res)
      DeviceValue.deviceStatus = res.map(item => {
        let status = {
          update_time: new Date(),
          new_value: '',   //目前是数字
          function_title: item.function_title,
          function_data_type: item.function_data_type,
          function_identification: item.function_identification,
          function_range: item.function_range
        }
        return status;
      });
    })
    .catch(err => {
      console.error(err);
    })


  console.log("topics:", topics)

  console.log("DeviceValue:", DeviceValue)


  await MogoModule.DeviceTopic.insertMany(topics)
    .then(async res => {
      console.log(res)
      return await MogoModule.DeviceValue.insertMany(DeviceValue)
    })
    .then(res => {
      console.log(res)
    })
    .catch(err => {
      console.error(err);
    })

  // 查询全部产品信息
  let devices = [];
  await MogoModule.Device.find()
    .then(res => {
      // console.log(res)
      devices = res;
    })
    .catch(err => {
      console.log(err)
    })
  ctx.body = devices;
});

router.delete('/device/:name', async (ctx, next) => {
  let name = ctx.params.name;
  console.log(name);
  await MogoModule.Device.deleteOne({device: name})
  .then(async res => {
    console.log(res)
    return await MogoModule.DeviceTopic.deleteMany({devicename: name})
  })
  .then( async res => {
    console.log(res)
    return await MogoModule.DeviceValue.deleteMany({devicename: name})
  })
  .then(res => {
    console.log(res)
  })
  .catch(err => {
    console.error(err);
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



app.listen(3000, () => {
  console.log('listenning on 3000');
});
