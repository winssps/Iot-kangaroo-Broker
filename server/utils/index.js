const jwtJson = require('jsonwebtoken'); // 用于签发、解析`token`
const secret = 'secret';


/* 获取一个期限为4小时的token */
function getToken(payload = {}) {
  return jwtJson.sign(payload, secret, { expiresIn: '4h' });
}

/* 通过token获取JWT的payload部分 */
function getJWTPayload(token) {
  // 验证并解析JWT
  return jwtJson.verify(token.split(' ')[1], secret);
}

module.exports = {
  getToken: getToken,
  getJWTPayload: getJWTPayload,
};