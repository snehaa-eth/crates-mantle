

const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR]: ${err.message}`);

  let statusCode = err.statusCode || 500;
  let message = err.message || "Server Error";

  // Handle specific known error types
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors).map((val) => val.message).join(", ");
  }

  if (err.code === 11000) {
    // Duplicate key error (like unique email)
    statusCode = 400;
    message = "Duplicate field value entered";
  }

  if (err.name === "CastError") {
    // Bad ObjectId
    statusCode = 404;
    message = `Resource not found with id of ${err.value}`;
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
};

module.exports = errorHandler;
