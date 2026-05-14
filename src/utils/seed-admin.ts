/**
 * Seed default admin user if none exists
 * Run once on startup to initialize the database with an admin account
 */

import mongoose from 'mongoose';
import { User } from '../module/auth/auth.model';
import { hashPassword } from '../module/auth/auth.utils';

const DEFAULT_ADMIN = {
  name: 'Administrator',
  email: 'admin@cattlecare.com',
  password: 'Admin@123', // Change this in production
  role: 'admin' as const,
};

export async function seedAdminUser() {
  try {
    // Check if any admin user exists
    const adminExists = await User.findOne({ role: 'admin' });
    
    if (adminExists) {
      console.log('✓ Admin user already exists, skipping seed');
      return;
    }

    // Check if any user exists at all
    const userCount = await User.countDocuments();
    
    if (userCount > 0) {
      console.log('⚠ Users exist but no admin found. Please create an admin manually or delete all users and restart.');
      return;
    }

    // Create default admin
    const passwordHash = hashPassword(DEFAULT_ADMIN.password);
    const adminUser = new User({
      name: DEFAULT_ADMIN.name,
      email: DEFAULT_ADMIN.email,
      passwordHash,
      role: DEFAULT_ADMIN.role,
      isActive: true,
    });

    await adminUser.save();
    console.log('✓ Default admin user created successfully');
    console.log(`  Email: ${DEFAULT_ADMIN.email}`);
    console.log(`  Password: ${DEFAULT_ADMIN.password}`);
    console.log('  ⚠ IMPORTANT: Change this password immediately in production!');
  } catch (error) {
    console.error('✗ Error seeding admin user:', error);
    throw error;
  }
}
