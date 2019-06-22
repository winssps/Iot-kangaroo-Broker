const mongoose = require('mongoose');


var ProductSchema = new mongoose.Schema({
  product_title: String,
  productkey: String,
  node_type: String,
  add_time: Date
});

const Product = mongoose.model('Product', ProductSchema);


var TopicSchema = new mongoose.Schema({
  productkey: String,
  topic: String,
  permission: String,
  describe: String,
  count: Number
});

const Topic = mongoose.model('Topic', TopicSchema);


var FunctionSchema = new mongoose.Schema({
  productkey: String,
  function_data_type: String,
  function_data_unit: String,
  function_identification: String,
  function_label: String,
  function_start_value: Number,
  function_end_value: Number,
  function_range: String,
  function_title: String,
  function_type: String
});

const Functions = mongoose.model('Functions', FunctionSchema);


var DeviceSchema = new mongoose.Schema({
  productkey: String,
  device: String,
  type: String,
  status: String,
  ipaddress: String,
  add_time: Date,
  active_time: Date,
  last_time: Date
});

const Device = mongoose.model('Device', DeviceSchema);

var DeviceTopicSchema = new mongoose.Schema({
  devicename: String,
  productkey: String,
  topic: String,
  permission: String,
  describe: String,
  count: Number
});

const DeviceTopic = mongoose.model('DeviceTopic', DeviceTopicSchema);

var deviceStatusSchema = new mongoose.Schema({
  function_title: String,
  function_data_type: String,
  function_identification: String,
  update_time: Date,
  new_value: Number,   //目前是数字
  function_range: String
});

const DeviceValueSchema = new mongoose.Schema({
  productkey: String,
  devicename: String,
  deviceStatus: [deviceStatusSchema]
});

var DeviceValue = mongoose.model('DeviceValue', DeviceValueSchema);

module.exports = {
  Product,
  Topic,
  Functions,
  Device,
  DeviceTopic,
  DeviceValue
};


// module.exports = Object.assign({}, Product, Topic);
