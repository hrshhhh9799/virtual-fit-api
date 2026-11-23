# Virtual Fit API

REST API for the Virtual Fit application with features:
- User photo and size measurements upload
- 3D modal for virtual try-on
- Cloth link paste and analysis
- Fit assessment and recommendations
- Trend tracking
- Cart and ordering
- Cloth information and details
- Photo upload for clothes database
- Smart clothing suggestions

## Endpoints

### Users
- `POST /api/users` - Create user profile with photo and measurements
- `GET /api/users/:id` - Get user profile

### Clothes
- `POST /api/clothes` - Add new cloth with photo and size
- `GET /api/clothes` - List all clothes
- `GET /api/clothes/:id` - Get cloth details
- `POST /api/clothes/:id/try-on` - Virtual try-on simulation

### Try-ons
- `POST /api/try-ons` - Create a virtual try-on session
- `GET /api/try-ons/:id` - Get try-on results

### Cart
- `POST /api/cart` - Add item to cart
- `GET /api/cart` - Get cart contents
- `DELETE /api/cart/:id` - Remove from cart

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders/:id` - Get order details