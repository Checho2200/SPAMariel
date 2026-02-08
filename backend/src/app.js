const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');
const authRoutes = require('./routes/authRoutes');

const app = express();

// Security Middleware
app.use(helmet());
app.use(cors());
app.use(mongoSanitize()); // Prevent NoSQL Injection
app.use(xss()); // Prevent XSS attacks
app.use(hpp()); // Prevent HTTP Param Pollution

// Rate Limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
});
app.use(limiter);

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.send('API is running...');
});

// Error Middleware
app.use(notFound);
app.use(errorHandler);

module.exports = app;
