# 🚀 Postman Setup Guide for Dirwaza API

## ❌ Problem: `GET /api/bookings` not working in Postman

The issue is that the `/api/bookings` endpoint requires **admin authentication**, but you don't have a valid admin token.

## ✅ Solution: Follow these steps

### Step 1: Create Admin User (if needed)

First, check if you have an admin user in your database. If not, create one:

```javascript
// Run this in MongoDB or create a script
db.users.insertOne({
  name: "Admin User",
  phone: "+966501234567",
  password: "$2b$10$hashedPasswordHere", // You need to hash "admin123"
  role: "admin",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
});
```

### Step 2: Use Admin Login in Postman

1. **Open Postman** and load the Dirwaza API collection
2. **Find "Login User"** request (it's the admin login)
3. **Set the request body** to:
   ```json
   {
     "phone": "+966501234567",
     "password": "admin123"
   }
   ```
4. **Send the request** - you should get a response like:
   ```json
   {
     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     "user": {
       "id": "user_id",
       "name": "Admin User",
       "phone": "+966501234567",
       "role": "admin"
     }
   }
   ```

### Step 3: The token is automatically saved

The Postman collection has a **test script** that automatically saves the token:
```javascript
pm.collectionVariables.set("token", pm.response.json().token);
```

This saves the token as `{{admin_token}}` variable.

### Step 4: Test Get Bookings

Now you can use the **"Get All Bookings"** request:
- The request already has `Authorization: Bearer {{admin_token}}`
- It will use the token from Step 3 automatically
- You should get a response like:
  ```json
  {
    "success": true,
    "data": [...bookings],
    "total": 5
  }
  ```

## 🔧 Alternative: Test with curl

If you want to test manually:

```bash
# 1. Login to get token
TOKEN=$(curl -s -X POST http://localhost:5001/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"phone": "+966501234567", "password": "admin123"}' \
  | jq -r '.token')

# 2. Use token to get bookings
curl -X GET "http://localhost:5001/api/bookings" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq .
```

## 📋 Updated Postman Collection

I've already updated your Postman collection with:
- ✅ Proper admin login request body
- ✅ Correct response structure documentation for Get Bookings
- ✅ Authentication setup

## 🚨 Important Notes

1. **Replace credentials**: Change `+966501234567` and `admin123` with your actual admin credentials
2. **Check database**: Make sure you have an admin user with `role: "admin"`
3. **Server running**: Ensure your server is running on `http://localhost:5001`
4. **Environment variables**: Make sure your `.env` file has `JWT_SECRET` set

## 🎯 Expected Response Structure

After following these steps, `GET /api/bookings` will return:
```json
{
  "success": true,
  "data": [
    {
      "_id": "booking_id",
      "userName": "User Name",
      "userPhone": "+966501234567",
      "bookingStatus": "confirmed",
      "paymentStatus": "pending",
      "amount": 151,
      "bookingType": "plants",
      "createdAt": "2025-07-30T07:37:06.513Z",
      // ... more booking fields
    }
  ],
  "total": 1
}
```

## ✅ Success!

Once you have a valid admin token, all admin endpoints will work:
- `GET /api/bookings` ✅
- `GET /api/admin/users` ✅  
- `GET /api/contacts` ✅
- `GET /api/experiences/all` ✅

The issue was simply missing authentication, not a problem with the API itself! 🎉
