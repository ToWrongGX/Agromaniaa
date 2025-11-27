# FarmMarket Backend API

A Node.js/Express API for agricultural marketplace management with crop listings, buyer requests, and price trend tracking.

## Features

- **Crop Management**: Add, list, update, and delete crop listings
- **Buyer Requests**: Register buyer interest and manage requests
- **Price Tracking**: Monitor and record price trends over time
- **File Uploads**: Support for crop images with multer
- **Data Validation**: Input validation using express-validator
- **JSON Database**: Lightweight file-based storage with lowdb
- **CORS Enabled**: Ready for frontend integration

## Installation

1. Install dependencies:
```bash
npm install
```

2. (Optional) Install nodemon for development:
```bash
npm install --save-dev nodemon
```

## Running the Server

**Development mode** (with auto-reload):
```bash
npm run dev
```

**Production mode**:
```bash
npm start
```

The server will run on `http://localhost:4000` by default.

## API Endpoints

### Crops
- `GET /api/crops` - List all crops (supports filters: name, location, soilType, season)
- `POST /api/crops` - Add new crop (with image upload)
- `GET /api/crops/:id` - Get crop by ID
- `PATCH /api/crops/:id` - Update crop
- `DELETE /api/crops/:id` - Delete crop

### Buyers
- `GET /api/buyers` - List all buyer requests
- `POST /api/buyers` - Create new buyer request
- `GET /api/buyers/:id` - Get buyer by ID
- `PATCH /api/buyers/:id` - Update buyer status
- `DELETE /api/buyers/:id` - Delete buyer request

### Admin/Analytics
- `GET /api/admin/stats` - Dashboard statistics
- `POST /api/admin/prices` - Record price entry
- `GET /api/admin/prices` - Get price history
- `GET /api/admin/trends` - Get price trends by crop
- `DELETE /api/admin/prices/:id` - Delete price entry
- `GET /api/admin/export` - Export all data

### Health
- `GET /api/health` - Check API status

## Database Structure

The app uses a JSON file (`db.json`) with three collections:

```json
{
  "crops": [],
  "buyers": [],
  "prices": []
}
```

## Environment Variables

Create a `.env` file (optional):
```
NODE_ENV=development
PORT=4000
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
```

## Folder Structure

```
server/
├── index.js                 # Main Express app
├── package.json
├── db.json                  # JSON database file
├── uploads/                 # Uploaded images
├── routes/
│   ├── crops.js            # Crop endpoints
│   ├── buyers.js           # Buyer endpoints
│   └── admin.js            # Admin/analytics endpoints
└── utils/
    └── db.js               # Database utility functions
```

## Technologies Used

- **Express.js** - Web framework
- **CORS** - Cross-origin support
- **Multer** - File upload handling
- **Nanoid** - Unique ID generation
- **Express-validator** - Input validation
- **lowdb** - JSON database

## Notes

- Images are stored in the `uploads/` folder
- Maximum file size: 5MB
- Allowed image types: JPEG, PNG, GIF, WebP
- All timestamps are in ISO 8601 format
- Database syncs to file automatically on write

## License

ISC
