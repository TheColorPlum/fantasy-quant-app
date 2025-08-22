import { execSync } from 'child_process';
import { resolve } from 'path';
import { PrismaClient } from '@prisma/client';

const DATABASE_URL = 'file:./test.db';

export async function setupTestDatabase() {
  // Set the test database URL
  process.env.DATABASE_URL = DATABASE_URL;
  
  try {
    // Generate Prisma client
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    // Run migrations
    execSync('npx prisma db push --force-reset', { stdio: 'inherit' });
    
    console.log('Test database setup complete');
  } catch (error) {
    console.error('Failed to setup test database:', error);
    throw error;
  }
}

export async function teardownTestDatabase() {
  try {
    const db = new PrismaClient();
    await db.$disconnect();
    
    // Clean up test database file
    const fs = await import('fs');
    const testDbPath = resolve('./test.db');
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  } catch (error) {
    console.error('Failed to teardown test database:', error);
  }
}

export async function seedTestData() {
  const db = new PrismaClient();
  
  try {
    // Create test user
    const user = await db.user.create({
      data: {
        id: 'test-user-1',
        email: 'test@example.com',
        handle: 'testuser'
      }
    });

    console.log('Test data seeded successfully');
    return { user };
  } catch (error) {
    console.error('Failed to seed test data:', error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}