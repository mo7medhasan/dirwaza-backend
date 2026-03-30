/**
 * Send a success response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {Object} data - Response data
 * @param {string} [message] - Optional success message
 */
export const sendSuccessResponse = (res, statusCode = 200, data = {}, message) => {
  const response = {
    success: true,
    ...data
  };
  
  if (message) {
    response.message = message;
  }
  
  return res.status(statusCode).json(response);
};

/**
 * Send an error response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {Object} [errors] - Optional validation errors
 */
export const sendErrorResponse = (res, statusCode = 500, message = 'An error occurred', errors = null) => {
  const response = {
    success: false,
    error: message
  };
  
  if (errors) {
    response.errors = errors;
  }
  
  return res.status(statusCode).json(response);
};

/**
 * Send a validation error response
 * @param {Object} res - Express response object
 * @param {Object} errors - Validation errors from express-validator
 */
export const sendValidationError = (res, errors) => {
  return sendErrorResponse(
    res, 
    400, 
    'Validation failed', 
    errors.array().map(err => ({
      field: err.path,
      message: err.msg
    }))
  );
};
