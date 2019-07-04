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
        // console.log(payloadData)
      } else if (typeof payload == 'object') {
        payloadData = payload;
      }
      await MogoModule.DeviceTopic.find({ devicename: from_client_id, topic: topic })
      let result = await MogoModule.DeviceValue.find({ devicename: from_client_id })
      console.log(result[0].deviceStatus)

      console.log(payloadData)
      let statusDataArr = result[0].deviceStatus;

      for (payload_key in payloadData) {
        console.log('key:', payload_key)
        console.log("statusDataArr.length", statusDataArr.length)
        for (let i = 0; i < statusDataArr.length; i++) {
          if (statusDataArr[i]['function_identification'] == payload_key) {

            let range = statusDataArr[i]['function_range'].split('~');
            console.log(range)
            if(payloadData[payload_key] >= range[0] && payloadData[payload_key] <= range[1]) {
              statusDataArr[i]['new_value'] = payloadData[payload_key];
              statusDataArr[i]['update_time'] = Date.now();
            }
          }
        }
      }

      console.log("statusDataArr:", statusDataArr)

      await MogoModule.DeviceValue.updateMany({ devicename: from_client_id }, { deviceStatus: statusDataArr })
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