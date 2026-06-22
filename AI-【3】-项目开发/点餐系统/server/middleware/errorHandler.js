function errorHandler(err, req, res, next) {
  console.error('❌', err.stack || err.message);
  res.status(err.status || 500).json({
    code: err.status || 500,
    msg: err.message || '服务器内部错误'
  });
}

module.exports = errorHandler;
