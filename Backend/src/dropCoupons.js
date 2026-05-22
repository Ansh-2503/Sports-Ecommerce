import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI;

const deleteOld = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB.");
    const collections = await mongoose.connection.db.collections();
    for (let c of collections) {
      if (c.collectionName === "coupons") {
        const result = await c.deleteMany({});
        console.log(`Deleted ${result.deletedCount} legacy coupons.`);
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
    console.log("Cleanup complete.");
  }
};

deleteOld();
