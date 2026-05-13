/**
 * Wraps async Express route handlers so rejected promises invoke next(err)
 * and reach the global error middleware.
 */
function asyncHandler(fn) {
  return function asyncHandlerWrapped(req, res, next) {
    try {
      const out = fn(req, res, next);
      if (out != null && typeof out.catch === 'function') {
        out.catch(next);
      }
    } catch (e) {
      next(e);
    }
  };
}

module.exports = { asyncHandler };
