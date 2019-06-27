var router = require('koa-router')();
const MogoModule = require('../models/mongodb');

/**
 * EMQX webHook 
 */

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

module.exports = router;