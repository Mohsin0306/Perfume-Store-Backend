const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const connectDB = require('./config/db');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const http = require('http');
const { initializeSocket } = require('./services/socketService');
const webpush = require('web-push');
const PushSubscription = require('./models/PushSubscription');
const auth = require('./middleware/auth');
const recentRoutes = require('./routes/RecentRoutes');
const bannerRoutes = require('./routes/bannerRoutes');

const app = express();

// Update CORS configuration
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'https://pure-fragrance.vercel.app'
    ];
    callback(null, true); // temporarily allow all origins for testing
  },
  credentials: true
}));

// Middleware
app.use(express.json());

// Connect to MongoDB
connectDB();

// Configure web-push
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Routes
const authRoutes = require('./routes/authRoutes');
const buyerRoutes = require('./routes/buyerRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const chatRoutes = require('./routes/chatRoutes');
const adminProfileRoutes = require('./routes/adminProfileRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/buyers', buyerRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminProfileRoutes);

// Add endpoint for push subscription
app.post('/api/push-subscription', auth, async (req, res) => {
  try {
    const { subscription } = req.body;
    
    // Save or update subscription
    await PushSubscription.findOneAndUpdate(
      { userId: req.user.id },
      { 
        userId: req.user.id,
        subscription 
      },
      { upsert: true, new: true }
    );

    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Error saving push subscription:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error saving subscription' 
    });
  }
});

// Add recent activities routes
app.use('/api/recent', recentRoutes);

// Add banner routes
app.use('/api/banners', bannerRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  // Send appropriate error response
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Basic health check route - Updated for verification
app.get('/', (req, res) => {
  res.status(200).json({ 
    success: true,
    message: 'Welcome to Perfume Store API - v2',
    status: 'online'
  });
});

// Export the Express app for Vercel
module.exports = app;

// Only start the server when running locally
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}
