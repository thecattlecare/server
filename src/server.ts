import app from "./app";
import { connectDatabase } from "./config/db";

const PORT = process.env.PORT || 5000;
const start = async () => {
  await connectDatabase();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  })
}

start();
