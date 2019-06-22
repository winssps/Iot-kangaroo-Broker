var mqtt = require('mqtt')
var client = mqtt.connect('mqtt://emqx@127.0.0.1', {
  clientId: 'mqtt_hallRH',
  // username: 'admin',
  password: 'public'
})

client.on('connect', function (connack) {

  console.log(connack)
  // 向服务器端订阅一个频道
  // client.subscribe('presence');

  // 向服务器端发布数据  
  client.publish('/FgSKodQfBhS/mqtt_hallRH/user/update', JSON.stringify({hallRH: 20}));
  // client.publish('/FgSKodQfBhS/mqtt_hallRH/user/update/error', "hello error");


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