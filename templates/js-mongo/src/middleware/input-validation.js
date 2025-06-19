import { validationResult } from 'express-validator';
import createError from 'http-errors';

export const validateInputs = (inputs) => {
  return [
    ...inputs,
    (req, res, next) => {
      const errors = validationResult(req);
      if (errors.isEmpty()) {
        return next();
      }
      const validationErrors = errors.array().map((error) => error.msg);
      const error = createError(422, validationErrors.join(', '));

      return next(error);
    },
  ];
};
