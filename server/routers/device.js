const router = require('koa-router')();
const MogoModule = require('../models/mongodb');


router.get('/', async (ctx, next) => {
  let devices = await MogoModule.Device.find()
  console.log(devices)
  ctx.body = devices;
});

router.get('/:name', async (ctx, next) => {
  let deviceName = ctx.params.name;
  let devices = {};
  // 更新 设备的function

  devices.detail = await MogoModule.Device.find({ device: deviceName }, { _id: 0, __v: 0 })
  devices.topic = await MogoModule.DeviceTopic.find({ devicename: deviceName }, { _id: 0, __v: 0 })


  devices.value = await MogoModule.DeviceValue.find({ devicename: deviceName }, { _id: 0, __v: 0 })

  console.log("devices.value:", devices.value[0])

  let funs = await MogoModule.Functions.find({ productkey: devices.detail[0].productkey }, { _id: 0, __v: 0 })
  var newdeviceStatus = funs.map(item => {
    let status = {
      update_time: '',
      new_value: '',   //目前是数字
      function_title: item.function_title,
      function_data_type: item.function_data_type,
      function_identification: item.function_identification,
      function_range: item.function_range
    }
    return status;
  });
  // 合并
  devices.value[0].deviceStatus.map((item, index) => {
    newdeviceStatus[index] = item;
  })
  await MogoModule.DeviceValue.updateMany({ devicename: deviceName },{deviceStatus: newdeviceStatus})
  devices.value = await MogoModule.DeviceValue.find({ devicename: deviceName }, { _id: 0, __v: 0 })

  ctx.body = devices;
});

router.post('/', async (ctx, next) => {
  let data = ctx.request.body;
  console.log(data)
  let productkey = data.productkey;
  let deviceName = data.device;
  let DeviceValue = {
    productkey: productkey,
    devicename: deviceName,
    deviceStatus: []
  };
  // 新建一个设备，save 设备基础信息
  let device = new MogoModule.Device(data);
  let result = await device.save(data)

  // 更新设备的topics 
  let topics = await MogoModule.Topic.find({ productkey: productkey }, { _id: 0, __v: 0 })
  topics = topics.map(item => {
    let JsonDevice = JSON.stringify(item);
    let topic = Object.assign({ devicename: '' }, JSON.parse(JsonDevice));
    topic.topic = item.topic.replace(/\$\{deviceName\}/g, deviceName);
    topic.devicename = deviceName;
    return topic;
  })
  console.log("topics:", topics)
  await MogoModule.DeviceTopic.insertMany(topics)

  let funs = await MogoModule.Functions.find({ productkey: productkey }, { _id: 0, __v: 0 })
  DeviceValue.deviceStatus = funs.map(item => {
    let status = {
      update_time: '',
      new_value: '',   //目前是数字
      function_title: item.function_title,
      function_data_type: item.function_data_type,
      function_identification: item.function_identification,
      function_range: item.function_range
    }
    return status;
  });
  console.log("DeviceValue:", DeviceValue)

  await MogoModule.DeviceValue.insertMany(DeviceValue)

  // 查询全部产品信息
  let devices = await MogoModule.Device.find()
  ctx.body = devices;
});

router.delete('/:name', async (ctx, next) => {
  let name = ctx.params.name;
  console.log(name);
  await MogoModule.Device.deleteOne({ device: name })
  await MogoModule.DeviceTopic.deleteMany({ devicename: name })
  await MogoModule.DeviceValue.deleteMany({ devicename: name })
  ctx.body = { errmsg: 'ok', errcode: 0 };
})


module.exports = router;





