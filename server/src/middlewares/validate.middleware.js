import ApiError from "../utils/ApiError.js";

/**
 * Generic Zod validation middleware.
 * Pass a Zod schema shaped like: { body: z.object({...}), params: z.object({...}), query: z.object({...}) }
 */
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body: req.body,
    params: req.params,
    query: req.query,
  });

  if (!result.success) {
    const errors = result.error.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
    return next(ApiError.badRequest("Validation failed", errors));
  }

  // Overwrite with parsed/coerced values
  if (result.data.body) req.body = result.data.body;
  if (result.data.query) req.query = result.data.query;
  if (result.data.params) req.params = result.data.params;

  next();
};

export default validate;