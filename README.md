# 🚚 IslandLink Sales Distribution Network (ISDN) System

## 📌 Overview

The IslandLink Sales Distribution Network (ISDN) System is a full-stack web application developed to digitize and optimize the operations of a wholesale distribution company.

The system replaces manual processes such as phone-based ordering, paper documentation, and spreadsheet inventory tracking with a centralized digital platform. It connects retail customers, Regional Distribution Centres (RDCs), logistics teams, and head office administrators into a single system.

---

## ✨ Key Features

### 👤 Authentication & Security
- JWT-based authentication
- Role-Based Access Control (RBAC)
- OTP-based password reset
- Secure password hashing using bcrypt

### 🛒 Customer Features
- Browse product catalog
- Add to cart & checkout
- View order history
- Track deliveries in real-time
- Submit product reviews

### 🏬 RDC Staff Features
- Manage inventory
- Update stock levels
- Transfer stock between RDCs
- Process and dispatch orders

### 🚛 Logistics Features
- Register drivers
- Assign drivers to orders
- Track delivery status
- Manage fleet availability

### 🧑‍💼 Admin Features
- Manage users (roles & access)
- Add/edit/delete products
- Monitor orders
- Manage reviews
- View analytics dashboard

### 🔔 System Features
- Notifications system
- Real-time inventory updates
- Order lifecycle tracking

---

## 🏗️ System Architecture

The system follows a **Layered Architecture**:

- **Presentation Layer:** React frontend
- **Application Layer:** Node.js + Express backend
- **Persistence Layer:** MongoDB database
- **Storage Layer:** Supabase (images & invoices)

---

## 🛠️ Technologies Used

### Frontend
- React.js
- Vite
- Tailwind CSS
- React Router v6
- Axios

### Backend
- Node.js
- Express.js
- JWT (JSON Web Tokens)
- bcrypt.js

### Database
- MongoDB Atlas
- Mongoose ODM

### Storage
- Supabase Storage

### Dev Tools
- Git & GitHub
- Environment Variables (.env)

---

## 👥 User Roles

| Role              | Description |
|------------------|------------|
| Customer         | Places orders, tracks deliveries |
| RDC Staff        | Manages stock and order fulfillment |
| Logistics Officer| Assigns drivers and manages deliveries |
| Admin            | Full system control and monitoring |

---

## ⚙️ Installation & Setup

### 🔧 Prerequisites

Make sure you have installed:
- Node.js (v14 or higher)
- npm or yarn
- MongoDB (Local or Atlas)

---

### 📥 1. Clone the Repositories

```
# Frontend
git clone https://github.com/MaheraKeshan/ISDN_Frontend.git

# Backend
git clone https://github.com/MaheraKeshan/ISDN_Backend.git

```

📦 2. Install Dependencies
Backend
```
cd ISDN_Backend
npm install
```
Frontend

```
cd ISDN_Frontend
npm install

```
🔐 3. Environment Variables

Create a .env file in the backend folder:

MONGO_URL=your_mongodb_connection_string
JWT_SECRET=your_secret_key
PORT=3000

▶️ 4. Run the Application

Start Backend
cd ISDN_Backend
npm start
Start Frontend
cd ISDN_Frontend
npm run dev

🌐 5. Open in Browser

http://localhost:5173

🗄️ Database Collections
users
products
orders
inventory
drivers
reviews
notifications
otps

🔒 Security Features

JWT Authentication
Password Hashing (bcrypt)
Role-Based Authorization
Protected Routes
Input Validation
Secure API communication

📊 Project Status

This project was developed as a working prototype for the Advanced Software Engineering module. It demonstrates how a digital platform can improve efficiency, reduce manual errors, and enhance transparency in distribution operations.

👨‍💻 Authors

Kavinda Gimhan
Mahera Keshan
Aparna Rajaguru
Hiruni Kaveesha

🔗 Repository Links
Frontend: https://github.com/MaheraKeshan/ISDN_Frontend.git
Backend: https://github.com/MaheraKeshan/ISDN_Backend

📄 License

This project is developed for academic purposes.

## Academic Supervision
This project was guided  by Nimesha Rajakaruna as part of undergraduate coursework.

Git Hub Name - nimesharajakaruna1-beep
