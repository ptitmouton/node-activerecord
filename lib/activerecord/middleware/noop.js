(function() {
  var NoopMiddleware;

  module.exports = NoopMiddleware = (function() {
    function NoopMiddleware() {}

    NoopMiddleware.supports = {
      beforeWrite: false,
      afterWrite: false
    };

    return NoopMiddleware;

  })();

}).call(this);
