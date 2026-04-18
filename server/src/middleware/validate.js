const { ZodError } = require('zod');

/**
 * validate — Zod validation middleware factory.
 * Validates req.body against the provided Zod schema.
 * On failure, returns 400 with structured field errors.
 *
 * @param {import('zod').ZodSchema} schema - Zod schema to validate against
 * @param {'body' | 'query' | 'params'} source - Which part of the request to validate (default: 'body')
 */
function validate(schema, source = 'body') {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req[source]);
      // Replace the request property with the parsed (coerced) value
      req[source] = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const errors = err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return res.status(400).json({
          error: 'Validation failed.',
          details: errors,
        });
      }
      next(err);
    }
  };
}

module.exports = { validate };
