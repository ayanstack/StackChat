//  * Wraps async route handlers/controllers so we don't repeat
//  * try/catch everywhere. Any thrown/rejected error is forwarded
//  * to Express's error-handling middleware via next(err).
//  *
//  * Usage:
//  *   router.post("/login", asyncHandler(authController.login));

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;