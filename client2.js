var mqtt = require('mqtt')
var client  = mqtt.connect('mqtt://localhost')
client.on('connect', function () {

    // 向服务器端订阅一个频道
    // 向服务器端发布数据  
    // client.publish('clients/online', JSON.stringify({id:client.options.clientId}))
    
})


client.on('message', function (topic, message) {
    // 订阅的频道收到信息
    console.log("等级为: " + message.toString())
    if(message.toString() == "关闭") {
        client.publish('presence', '0')
    }else if(message.toString() == "低速") {
        client.publish('presence', '20')
    } else if(message.toString() == "普通") {
        client.publish('presence', '80')
    } else if(message.toString() == "高速") {
        client.publish('presence', '150')
    }
    // client.end()
  })