# 🍱 Food Share – Intelligent Food Donation & Distribution Platform

## 📖 Project Overview

**Food Share** is a full-stack web application designed to reduce food wastage while ensuring surplus food reaches NGOs and people in need quickly and safely.

Unlike traditional food donation platforms, Food Share uses **intelligent matching**, **location-based recommendations**, and **food quality validation** to make the donation process faster, more reliable, and more efficient.

---

# 🎯 Problem Statement

Millions of tons of edible food are wasted every year, while many people struggle to access nutritious meals.

Traditional donation systems face several challenges:

- No proper donor-recipient matching
- Multiple NGOs responding to the same donation
- Long transportation distances leading to food spoilage
- Fake or unverified NGOs
- No estimation of whether donated food is still safe to consume

Food Share addresses these challenges using technology.

---

# ✨ Key Features

## 👥 Separate Authentication

- Donor Login
- NGO Login
- Independent registration and authentication for both users.

---

## 🍛 Food Donation

Donors can:

- Register food donations
- Enter food details
- Specify cooking time
- Mention quantity
- Provide pickup location

---

## 🏢 NGO Registration

NGOs can:

- Register on the platform
- Verify their organization
- Submit food requirements
- View nearby available donations

---

## 📜 NGO Verification

To improve trust and prevent misuse,

- NGOs upload verification certificates.
- Verified NGOs receive priority for donations.

---

## 🤖 ML-Based Smart Matching

The system intelligently matches donations with NGOs based on:

- Shortest travel distance
- Food availability
- NGO requirements
- Location proximity

This helps reduce transportation time and food wastage.

---

## 🍲 Food Freshness Prediction

The application estimates whether donated food is still safe for consumption using:

- Cooking time
- Current time
- Food freshness duration

This helps NGOs avoid collecting spoiled food.

---

## 📩 Duplicate Allocation Prevention

Once an NGO accepts a donation,

- Other NGOs are notified that the food is unavailable.
- Duplicate food collection requests are prevented.
- Donors receive confirmation of the successful allocation.

This ensures every donation is served only once.

---

# 🛠️ Technology Stack

### Frontend

- React.js
- Vite
- JavaScript
- HTML
- CSS

### Backend

- Node.js
- Express.js

### Database

- MongoDB

### APIs & Services

- REST APIs

---

# 📂 Project Architecture

```text
React Frontend
      │
      ▼
Express REST API
      │
      ▼
MongoDB Database
      │
      ▼
ML Matching Logic
      │
      ▼
Live tracking and status
```

---

## ⚙️ Installation

### 1. Clone the repository

```bash
git clone https://github.com/Varshabala009/Food-share.git
```

### 2. Install Frontend Dependencies

```bash
cd food-share
npm install
npm run dev
```

### 3. Install Backend Dependencies

```bash
cd food-share-backend
npm install
npm start
```

---

## 🔐 Environment Variables

Create a `.env` file inside the `food-share-backend` folder.

Example:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

> **Note:** Never upload `.env` files or API keys to GitHub.

---

## 📸 Screenshots

### Home Page
<img width="1600" height="841" alt="image" src="https://github.com/user-attachments/assets/20d06e5c-6500-4703-a5c5-8fdc3a856b73" />
<img width="1600" height="837" alt="image" src="https://github.com/user-attachments/assets/61610a9f-e69c-4415-891d-be50666ecc25" />


### Donor Registration

<img width="1600" height="846" alt="image" src="https://github.com/user-attachments/assets/7fadb19d-07d2-4ba0-bad6-fe26d5e7bd18" />
<img width="1600" height="846" alt="image" src="https://github.com/user-attachments/assets/4a21203d-714a-483b-99aa-93f536a39812" />

### NGO Registration
<img width="1600" height="841" alt="image" src="https://github.com/user-attachments/assets/380a642c-2b8d-488c-8988-501d028909fe" />

### Food matching 
<img width="1600" height="829" alt="image" src="https://github.com/user-attachments/assets/b2ed265e-9857-4cc7-acc7-d5ff64e22ad1" />

### NGO/Organization certificate verification
<img width="1600" height="828" alt="image" src="https://github.com/user-attachments/assets/c15eace2-9efb-4a38-ba5f-0af7a56fcd7f" />

### No Duplicate serving and live tracking
<img width="1600" height="764" alt="image" src="https://github.com/user-attachments/assets/bfe2854c-d0ae-476e-8fd8-8aebade69928" />


## 💡 Future Enhancements

- AI-based donor and receiver matching
- Email & SMS notifications
- Real-time donation tracking
- Admin dashboard
- Analytics and reports

---

## 👩‍💻 Author

**Varsha Bala**

GitHub: https://github.com/Varshabala009

---

## ⭐ If you found this project useful, consider giving it a star!
