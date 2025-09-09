const jwt = require("jsonwebtoken");

// Create a mock JWT token for testing
const mockUserId = "507f1f77bcf86cd799439011"; // Mock user ID
const secret = "your-secret-key"; // Same secret as in the app

const token = jwt.sign(
  {
    sub: mockUserId,
    phone: "+998901234567",
    role: "USER",
  },
  secret,
  { expiresIn: "24h" }
);

console.log("Mock JWT Token:", token);
console.log("User ID:", mockUserId);
