import mongoose from 'mongoose';
import multer from 'multer';
import { AppError } from '../utils/AppError.js';

export function notFoundHandler(req, _res, next) {
  next(new AppError('Route not found', 404, 'ROUTE_NOT_FOUND'));
}

function mongooseDetails(error) {
  return Object.values(error.errors || {}).map((item) => ({
    field: item.path,
    message: item.message
  }));
}

export function errorMiddleware(error, req, res, _next) {
  if (res.headersSent) {
    _next(error);
    return;
  }
  let normalized = error;
  if (error instanceof mongoose.Error.ValidationError) {
    normalized = new AppError('Validation failed', 400, 'VALIDATION_ERROR', mongooseDetails(error));
  } else if (error instanceof mongoose.Error.CastError) {
    normalized = new AppError('Invalid resource identifier', 400, 'INVALID_IDENTIFIER');
  } else if (error?.code === 11000) {
    normalized = new AppError('A resource with these details already exists', 409, 'DUPLICATE_RESOURCE');
  } else if (error?.type === 'entity.parse.failed') {
    normalized = new AppError('Request body contains malformed JSON', 400, 'INVALID_JSON');
  } else if (error?.type === 'entity.too.large') {
    normalized = new AppError('Request body is too large', 413, 'PAYLOAD_TOO_LARGE');
  } else if (error instanceof multer.MulterError) {
    const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    normalized = new AppError(
      error.code === 'LIMIT_FILE_SIZE' ? 'The uploaded file exceeds 10 MB' : 'Invalid multipart upload',
      status,
      error.code
    );
  } else if (error?.name === 'MongoServerSelectionError' || error?.name === 'MongooseServerSelectionError') {
    normalized = new AppError('Database is temporarily unavailable', 503, 'DATABASE_UNAVAILABLE');
  } else if (!(error instanceof AppError)) {
    normalized = new AppError('Internal server error', 500, 'INTERNAL_ERROR');
  }
  if (normalized.statusCode >= 500) {
    const details = {
      method: req.method,
      path: req.path,
      status: normalized.statusCode,
      code: normalized.code
    };
    if (process.env.NODE_ENV !== 'production') {
      details.cause = error?.name;
      details.message = error?.message;
      details.stack = error?.stack;
    }
    console.error('Request failed', details);
  }
  const response = {
    success: false,
    message: normalized.message
  };
  /* 4xx bodies stay byte-identical to the documented contract; 5xx responses
     carry the internal code so the client can explain a provider failure. */
  if (normalized.statusCode >= 500) {
    response.code = normalized.code;
  }
  if (normalized.details && normalized.statusCode < 500) {
    response.details = normalized.details;
  }
  res.status(normalized.statusCode).json(response);
}
