require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const connectDB = require('./config/db');

connectDB();

const importData = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminName = process.env.ADMIN_NAME || 'Master Admin'; // Default fallback

    if (!adminEmail || !adminPassword) {
      console.error('Error: ADMIN_EMAIL and ADMIN_PASSWORD must be defined in .env file');
      process.exit(1);
    }

    // Check if admin already exists
    const adminExists = await User.findOne({ email: adminEmail });

    if (adminExists) {
      console.log('Admin user already exists');
      process.exit();
    }

    // Create Admin User
    const adminUser = {
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
    };

    await User.create(adminUser);

    console.log('Sergio Ciudad Ora');
    console.log(`Email: ${adminUser.email}`);
    console.log(`Password: ${adminUser.password}`);
    process.exit();
  } catch (error) {
    console.error(`${error}`);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await User.deleteMany();
    console.log('Data Destroyed!');
    process.exit();
  } catch (error) {
    console.error(`${error}`);
    process.exit(1);
  }
};

if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}
