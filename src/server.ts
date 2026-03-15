import app from "./app";
import { connectDatabase } from "./config/db";

const PORT = process.env.PORT || 5000;

const retryDatabaseConnection = () => {
  setTimeout(async () => {
    try {
      await connectDatabase();
      console.log('✅ MongoDB reconnected');
    } catch {
      console.log('⏳ Retrying MongoDB connection in 10 seconds...');
      retryDatabaseConnection();
    }
  }, 10000);
};

const start = async () => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  try {
    await connectDatabase();
  } catch {
    console.log('⚠️  Server started without database connection.');
    console.log('⏳ Retrying MongoDB connection in 10 seconds...');
    retryDatabaseConnection();
  }
};

start();
