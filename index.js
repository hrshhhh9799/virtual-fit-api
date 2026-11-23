const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Ensure uploads directory exists
const fs = require('fs');
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads', { recursive: true });
}

// In-memory storage for demo (replace with database later)
let users = [];
let clothes = [];
let tryOnSessions = [];
let cart = [];
let orders = [];
let nextUserId = 1;
let nextClothId = 1;
let nextTryOnId = 1;
let nextOrderId = 1;

// ===== USER ROUTES =====

// Create user profile with photo and measurements
app.post('/api/users', upload.single('photo'), async (req, res) => {
  try {
    const { name, height, weight, bust, waist, hips, inseam, outseam } = req.body;
    const photo = req.file ? req.file.filename : null;

    const user = {
      id: nextUserId++,
      name,
      photo,
      height: height || 170, // default 170cm
      weight: weight || 65, // default 65kg
      measurements: {
        bust: bust || 85,
        waist: waist || 65,
        hips: hips || 95,
        inseam: inseam || 80,
        outseam: outseam || 100
      },
      createdAt: new Date()
    };

    users.push(user);
    res.status(201).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user profile
app.get('/api/users/:id', (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const user = users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== CLOTHES ROUTES =====

// Add new cloth with photo and size
app.post('/api/clothes', upload.single('photo'), async (req, res) => {
  try {
    const { name, type, brand, price, link, gender } = req.body;
    const photo = req.file ? req.file.filename : null;

    const cloth = {
      id: nextClothId++,
      name,
      type,
      brand,
      price: parseFloat(price) || 0,
      link,
      gender: gender || 'unisex',
      photo,
      timesWorn: 0,
      averageRating: 0,
      trendScore: 0,
      createdAt: new Date()
    };

    clothes.push(cloth);
    res.status(201).json({ success: true, cloth });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// List all clothes
app.get('/api/clothes', (req, res) => {
  try {
    // Sort by trend score
    const sorted = [...clothes].sort((a, b) => b.trendScore - a.trendScore);
    res.json({ success: true, clothes: sorted });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get cloth details
app.get('/api/clothes/:id', (req, res) => {
  try {
    const clothId = parseInt(req.params.id);
    const cloth = clothes.find(c => c.id === clothId);
    if (!cloth) {
      return res.status(404).json({ success: false, error: 'Cloth not found' });
    }
    res.json({ success: true, cloth });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Virtual try-on simulation
app.post('/api/clothes/:id/try-on', async (req, res) => {
  try {
    const clothId = parseInt(req.params.id);
    const cloth = clothes.find(c => c.id === clothId);
    if (!cloth) {
      return res.status(404).json({ success: false, error: 'Cloth not found' });
    }

    const { userId } = req.body;
    const user = users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Generate try-on result
    const tryOnResult = {
      id: nextTryOnId++,
      clothId,
      userId,
      fitAssessment: generateFitAssessment(user, cloth),
      trendAnalysis: analyzeTrend(cloth),
      looksGood: Math.random() > 0.3, // probabilistic result
      fitScore: Math.round(Math.random() * 100),
      description: generateDescription(user, cloth),
      createdAt: new Date()
    };

    tryOnSessions.push(tryOnResult);

    // Update cloth stats
    cloth.timesWorn = (cloth.timesWorn || 0) + 1;
    cloth.averageRating = Math.round(((cloth.averageRating || 0) + tryOnResult.fitScore) / 2);

    res.json({ success: true, tryOnResult });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== TRY-ON SESSIONS =====

// Create a virtual try-on session
app.post('/api/try-ons', async (req, res) => {
  try {
    const { userId, clothId } = req.body;

    const user = users.find(u => u.id === userId);
    const cloth = clothes.find(c => c.id === clothId);

    if (!user || !cloth) {
      return res.status(404).json({ success: false, error: 'User or cloth not found' });
    }

    const tryOnResult = {
      id: nextTryOnId++,
      clothId,
      userId,
      fitAssessment: generateFitAssessment(user, cloth),
      trendAnalysis: analyzeTrend(cloth),
      looksGood: Math.random() > 0.3,
      fitScore: Math.round(Math.random() * 100),
      description: generateDescription(user, cloth),
      createdAt: new Date()
    };

    tryOnSessions.push(tryOnResult);
    res.json({ success: true, tryOnResult });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get try-on results
app.get('/api/try-ons/:id', (req, res) => {
  try {
    const tryOnId = parseInt(req.params.id);
    const tryOn = tryOnSessions.find(t => t.id === tryOnId);
    if (!tryOn) {
      return res.status(404).json({ success: false, error: 'Try-on session not found' });
    }
    res.json({ success: true, tryOn });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== CART ROUTES =====

// Add item to cart
app.post('/api/cart', async (req, res) => {
  try {
    const { clothId, userId, quantity } = req.body;

    const cloth = clothes.find(c => c.id === clothId);
    if (!cloth) {
      return res.status(404).json({ success: false, error: 'Cloth not found' });
    }

    const existingItem = cart.find(c => c.clothId === clothId && c.userId === userId);
    if (existingItem) {
      existingItem.quantity += (quantity || 1);
    } else {
      cart.push({
        id: Date.now(),
        clothId,
        userId,
        quantity: quantity || 1,
        price: cloth.price
      });
    }

    res.json({ success: true, cart });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get cart contents
app.get('/api/cart', (req, res) => {
  try {
    res.json({ success: true, cart });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Remove from cart
app.delete('/api/cart/:id', (req, res) => {
  try {
    const cartId = parseInt(req.params.id);
    const index = cart.findIndex(c => c.id === cartId);
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Item not found in cart' });
    }
    cart.splice(index, 1);
    res.json({ success: true, cart });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== ORDERS ROUTES =====

// Create order
app.post('/api/orders', async (req, res) => {
  try {
    const { userId, items, shippingAddress } = req.body;

    const user = users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const orderItems = items.map(item => {
      const cloth = clothes.find(c => c.id === item.clothId);
      return {
        clothId: item.clothId,
        clothName: cloth ? cloth.name : 'Unknown',
        price: cloth ? cloth.price : 0,
        quantity: item.quantity || 1
      };
    });

    const order = {
      id: nextOrderId++,
      userId,
      items: orderItems,
      shippingAddress,
      total: orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
      status: 'pending',
      createdAt: new Date()
    };

    orders.push(order);

    // Remove items from cart
    cart = cart.filter(c => !items.some(item => c.clothId === item.clothId));

    res.status(201).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get order details
app.get('/api/orders/:id', (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const order = orders.find(o => o.id === orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== TREND ANALYSIS =====

// Analyze trend for a cloth item
function analyzeTrend(cloth) {
  // Simple trend analysis based on popularity and ratings
  const popularity = (cloth.timesWorn || 0) / Math.max(1, Date.now() - cloth.createdAt.getTime()) * 100000;
  const ratingFactor = cloth.averageRating || 0;
  const trendScore = Math.min(100, Math.round(popularity + ratingFactor * 10));

  return {
    score: trendScore,
    category: trendScore > 80 ? 'trending' : trendScore > 60 ? 'popular' : 'classic',
    description: getTrendDescription(trendScore)
  };
}

// Get trend description
function getTrendDescription(score) {
  if (score > 80) return 'Currently trending on social media';
  if (score > 60) return 'Popular among fashion enthusiasts';
  if (score > 40) return 'Classic style, timeless';
  return 'Niche style, unique choice';
}

// ===== UTILITY FUNCTIONS =====

// Generate fit assessment based on user measurements and cloth
function generateFitAssessment(user, cloth) {
  const measurements = user.measurements;
  const issues = [];

  // Simple fit logic - in production would use 3D body scanning
  let fitScore = 80; // base score

  // Check common fit issues
  if (measurements.bust && cloth.type === 'top') {
    if (Math.abs(measurements.bust - 90) > 15) {
      issues.push('Bust measurement may affect fit');
      fitScore -= 10;
    }
  }

  if (measurements.waist && cloth.type === 'dress') {
    if (Math.abs(measurements.waist - 70) > 10) {
      issues.push('Waist fit may need adjustment');
      fitScore -= 5;
    }
  }

  if (measurements.hips && cloth.type === 'bottoms') {
    if (Math.abs(measurements.hips - 100) > 15) {
      issues.push('Hip measurement may affect fit');
      fitScore -= 10;
    }
  }

  // Ensure minimum score
  fitScore = Math.max(0, fitScore);

  const assessment = {
    overallFit: fitScore,
    fitCategory: fitScore > 80 ? 'Perfect Fit' : fitScore > 60 ? 'Good Fit' : fitScore > 40 ? 'Average Fit' : 'Needs Adjustment',
    issues: issues,
    recommendations: generateFitRecommendations(issues, cloth.type)
  };

  return assessment;
}

// Generate fit recommendations
function generateFitRecommendations(issues, type) {
  const recs = [];
  if (issues.includes('Bust measurement may affect fit')) {
    recs.push('Consider sizes with adjustable bust or stretch fabric');
  }
  if (issues.includes('Waist fit may need adjustment')) {
    recs.push('Look for adjustable waistbands or empire waist styles');
  }
  if (issues.includes('Hip measurement may affect fit')) {
    recs.push('A-line cuts or relaxed fits may be more comfortable');
  }
  if (issues.length === 0) {
    recs.push('Fit looks great! Your measurements match well with this style');
  }
  return recs;
}

// Generate description for try-on result
function generateDescription(user, cloth) {
  return `${cloth.name} from ${cloth.brand} would ${cloth.link ? 'complement' : 'look great on'} you! ${cloth.type} style that ${Math.random() > 0.5 ? 'enhances your' : 'flatters your'} ${user.measurements ? 'figure' : 'style'}.`;
}

// Start server
app.listen(PORT, () => {
  console.log(`Virtual Fit API running on port ${PORT}`);
});

module.exports = app;