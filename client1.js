var mqtt = require('mqtt');

const clientId = 'mqtt_in34523';
const productKey = '5UVBqPltXj8';
let data = {
  InTemp: 90.56
};

const client = mqtt.connect('mqtt://emqx@127.0.0.1', {
  clientId: clientId,
  // username: 'admin',
  // password: 'public'
})

client.on('connect', function (connack) {

  console.log(connack)
  // 向服务器端订阅一个频道
  // client.subscribe('presence');

  // 向服务器端发布数据  
  client.publish(`/${productKey}/${clientId}/user/update`, JSON.stringify(data));

})

client.on('close', () => {
  console.log('客户端断开连接，即将关闭')
  // client.publish('clients/offline', JSON.stringify({id:client.options.clientId}))
})

client.on('disconnect', () => {
  console.log('client is disconnected')
})

client.on('offline', () => {
  console.log('client is offline')
})

client.on('end', function () {
  console.log("客户端断开连接，已经关闭")
})

client.on('message', function (topic, message) {
  // 订阅的频道收到信息
  console.log("message: " + message.toString())
  // client.end();
})