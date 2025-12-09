# 🚀 Spark LMS - Backend API

Backend server for Spark LMS (Learning Management System)

## 📋 Features

- RESTful API for course management
- Admin authentication & role-based access control
- Student progress tracking
- Order management
- Certificate generation
- Badge system
- Activity logging
- File upload handling
- MongoDB integration

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Atlas)
- **Authentication**: JWT & bcrypt
- **File Upload**: Multer
- **Firebase**: Admin SDK for notifications

## 📦 Installation

### Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account
- Firebase project (for notifications)

### Setup

1. Clone the repository:

```bash
git clone https://github.com/UmurAwais/spark-lms-backend.git
cd spark-lms-backend
```

2. Install dependencies:

```bash
npm install
```

3. Create `.env` file:

```env
MONGODB_URI=your_mongodb_connection_string
ADMIN_PASSWORD=your_admin_password
PORT=4001
NODE_ENV=development
```

4. Start the server:

```bash
# Development
npm run dev

# Production
npm start
```

## 🌐 API Endpoints

### Authentication

- `POST /api/admin/login` - Admin login
- `POST /api/admin/roles/invite` - Invite admin
- `POST /api/admin/roles/accept-invite` - Accept invitation

### Courses

- `GET /api/courses/onsite` - Get onsite courses
- `GET /api/courses/online` - Get online courses
- `POST /api/admin/courses` - Create course (admin)
- `PUT /api/courses/update/:type/:id` - Update course (admin)
- `DELETE /api/admin/courses/:type/:id` - Delete course (admin)

### Orders

- `GET /api/orders` - Get all orders
- `POST /api/orders` - Create order
- `PUT /api/orders/:id/status` - Update order status (admin)

### Users

- `GET /api/users` - Get all users (admin)
- `POST /api/users/register` - Register user
- `POST /api/users/login` - User login

### Admin Profile

- `GET /api/admin/profile` - Get admin profile
- `PUT /api/admin/profile` - Update admin profile
- `PUT /api/admin/change-password` - Change password

### Roles Management

- `GET /api/admin/roles` - Get all roles
- `GET /api/admin/roles/available` - Get available roles
- `DELETE /api/admin/roles/:id` - Revoke role

### Activity Logs

- `GET /api/admin/activity-logs` - Get activity logs
- `POST /api/admin/activity-logs` - Create activity log

### Certificates & Badges

- `GET /api/certificates` - Get certificates
- `POST /api/admin/certificates` - Create certificate
- `GET /api/badges` - Get badges
- `POST /api/admin/badges` - Create badge

## 🔒 Environment Variables

| Variable         | Description                          | Required |
| ---------------- | ------------------------------------ | -------- |
| `MONGODB_URI`    | MongoDB connection string            | Yes      |
| `ADMIN_PASSWORD` | Super admin password                 | Yes      |
| `PORT`           | Server port (default: 4001)          | No       |
| `NODE_ENV`       | Environment (development/production) | No       |
| `FRONTEND_URL`   | Frontend URL for CORS                | No       |

## 🚀 Deployment

### Vercel (Recommended)

1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Add environment variables in Vercel dashboard
4. Deploy: `vercel --prod`

### Render

1. Connect GitHub repository
2. Set build command: `npm install`
3. Set start command: `node index.js`
4. Add environment variables
5. Deploy

### Railway

1. Connect GitHub repository
2. Add environment variables
3. Deploy automatically

## 📁 Project Structure

```
server/
├── config/
│   └── roles.js          # Role permissions configuration
├── models/
│   ├── AdminRole.js      # Admin role model
│   ├── Course.js         # Course model
│   ├── OnlineCourse.js   # Online course model
│   ├── Order.js          # Order model
│   ├── User.js           # User model
│   ├── Certificate.js    # Certificate model
│   ├── Badge.js          # Badge model
│   └── ...
├── uploads/              # Uploaded files
├── index.js              # Main server file
├── package.json          # Dependencies
├── vercel.json          # Vercel configuration
└── .env                 # Environment variables
```

## 🔧 Development

### Run in development mode:

```bash
npm run dev
```

### Run in production mode:

```bash
npm start
```

## 📝 API Documentation

Full API documentation available at: `/api/docs` (coming soon)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is private and proprietary.

## 👥 Authors

- **Umur Awais** - [GitHub](https://github.com/UmurAwais)

## 🆘 Support

For support, email: support@sparktrainings.com

---

**Made with ❤️ for Spark Trainings**
