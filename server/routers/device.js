var router = require('koa-router')();
const MogoModule = require('../models/mongodb');


router.get('/', async (ctx, next) => {
  let devices = [];
  await MogoModule.Device.find()
    .then(res => {
      console.log(res)
      devices = res;
    })
    .catch(err => {
      console.log(err)
    })
  ctx.body = devices;
});

router.get('/:name', async (ctx, next) => {
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

router.post('/', async (ctx, next) => {
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

router.delete('/:name', async (ctx, next) => {
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


module.exports = router;





