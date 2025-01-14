// middleware for global error handling

const globalErrorHandle = (error, req, res, next) => {
  const statusCode = res?.statusCode || 500;
  res.status(statusCode);
  res.json({
    message: error.message,
    stack: process.env.NODE_ENV === "production" ? "🥞" : error.stack,
  });
};

export default globalErrorHandle;
