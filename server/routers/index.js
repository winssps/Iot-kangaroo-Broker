var router = require('koa-router')();

const ProductRoute = require('./product');
const DeviceRoute = require('./device');
const UserRoute = require('./user');
const WebHookRoute = require('./webhook');


router.use('/product', ProductRoute.routes(), ProductRoute.allowedMethods());
router.use('/device', DeviceRoute.routes(), DeviceRoute.allowedMethods());
router.use('/user', UserRoute.routes(), UserRoute.allowedMethods());
router.use('/webhook', WebHookRoute.routes(), WebHookRoute.allowedMethods());


module.exports = router;
