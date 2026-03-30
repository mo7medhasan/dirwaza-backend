import fs from 'fs';
import path from 'path';

const postmanFile = '/Users/ahmedabuzyad/Desktop/Desktop - ⁨‏⁨⁨MacBook Air⁩⁩ ⁨AHMED⁩‏⁩/dirwaza/dirwaza-backend/Dirwaza API.postman_collection.json';

// Read the current Postman collection
const collection = JSON.parse(fs.readFileSync(postmanFile, 'utf8'));

// Updated plant booking request body
const newPlantBookingBody = {
  "agreedToTerms": true,
  "personalInfo": {
    "fullName": "سارة أحمد محمد",
    "mobileNumber": "+966501234567",
    "notes": "أريد نباتات للحديقة المنزلية"
  },
  "recipientPerson": {
    "fullName": "سارة أحمد محمد",
    "mobileNumber": "+966501234567"
  },
  "deliveryAddress": {
    "city": "الرياض",
    "district": "النرجس",
    "street": "شارع الأمير محمد بن عبدالعزيز",
    "buildingNumber": "1234",
    "additionalNumber": "5678"
  },
  "orderData": [
    {
      "plantId": "507f1f77bcf86cd799439011",
      "quantity": 2,
      "unitPrice": 75.5
    },
    {
      "plantId": "507f1f77bcf86cd799439012",
      "quantity": 1,
      "unitPrice": 120
    }
  ],
  "paymentMethod": "apple_pay"
};

// Find and update the plant booking endpoint
function updatePlantBooking(items) {
  for (let item of items) {
    if (item.name === "Booking" && item.item) {
      for (let subItem of item.item) {
        if (subItem.name === "Create Plant Order Booking") {
          subItem.request.body.raw = JSON.stringify(newPlantBookingBody, null, 2);
          subItem.request.description = "Create plant order booking with delivery details and integrated NoqoodyPay payment URL. Updated API structure with personalInfo, recipientPerson, deliveryAddress, and orderData. Supports Apple Pay and other modern payment methods.";
          console.log('✅ Updated Plant Booking endpoint');
          return true;
        }
      }
    }
    if (item.item) {
      if (updatePlantBooking(item.item)) return true;
    }
  }
  return false;
}

// Add horse training booking if it doesn't exist
const horseBookingBody = {
  "agreedToTerms": true,
  "personalInfo": {
    "fullName": "أحمد محمد العلي",
    "parentName": "محمد العلي",
    "age": "12",
    "mobileNumber": "+966501111111",
    "previousTraining": "لا يوجد",
    "notes": "الطفل متحمس للتدريب"
  },
  "numberPersons": 1,
  "selectedCategoryId": "6882548dde85af2101c4d617",
  "selectedCourseId": "children-daily",
  "selectedAppointments": [
    {
      "date": "2025-07-27",
      "timeSlot": "18:00"
    }
  ]
};

function addHorseBooking(items) {
  for (let item of items) {
    if (item.name === "Booking" && item.item) {
      // Check if horse booking already exists
      const hasHorseBooking = item.item.some(subItem => 
        subItem.name === "Create Horse Training Booking"
      );
      
      if (!hasHorseBooking) {
        item.item.push({
          "name": "Create Horse Training Booking",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json",
                "type": "text"
              },
              {
                "key": "Accept",
                "value": "application/json",
                "type": "text"
              },
              {
                "key": "Accept-Language",
                "value": "ar",
                "type": "text"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": JSON.stringify(horseBookingBody, null, 2)
            },
            "url": {
              "raw": "{{base_url}}/api/bookings/horse",
              "host": ["{{base_url}}"],
              "path": ["api", "bookings", "horse"]
            },
            "description": "Create horse training booking with NoqoodyPay payment integration. Returns booking details with paymentUrl, paymentReference, and paymentMessage. Supports multiple payment methods including Apple Pay."
          },
          "response": []
        });
        console.log('✅ Added Horse Training Booking endpoint');
      }
      return true;
    }
    if (item.item) {
      if (addHorseBooking(item.item)) return true;
    }
  }
  return false;
}

// Update training endpoint URL
function updateTrainingEndpoint(items) {
  for (let item of items) {
    if (item.name === "Training" && item.item) {
      for (let subItem of item.item) {
        if (subItem.name.includes("Training") || subItem.name.includes("Get All")) {
          if (subItem.request && subItem.request.url) {
            subItem.request.url.raw = "{{base_url}}/api/training";
            subItem.request.url.path = ["api", "training"];
            subItem.request.description = "Get all available training categories and courses. Note: endpoint is /api/training (singular), not /api/trainings";
            console.log('✅ Updated Training endpoint URL');
            return true;
          }
        }
      }
    }
    if (item.item) {
      if (updateTrainingEndpoint(item.item)) return true;
    }
  }
  return false;
}

// Apply updates
console.log('🔄 Updating Postman collection...');

updatePlantBooking(collection.item);
addHorseBooking(collection.item);
updateTrainingEndpoint(collection.item);

// Write updated collection back to file
fs.writeFileSync(postmanFile, JSON.stringify(collection, null, 2));

console.log('🎉 Postman collection updated successfully!');
console.log('📝 Key updates made:');
console.log('   - Plant booking API structure updated');
console.log('   - Horse training booking endpoint added');
console.log('   - Training endpoint URL corrected to /api/training');
console.log('   - All endpoints include NoqoodyPay integration');
