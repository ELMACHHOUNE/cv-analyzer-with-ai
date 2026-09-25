export function validate(validator) {
  return function validationMiddleware(req, _res, next) {
    try {
      const validated = validator(req);
      req.validated = {
        ...(req.validated || {}),
        ...(validated || {})
      };
      next();
    } catch (error) {
      next(error);
    }
  };
}
