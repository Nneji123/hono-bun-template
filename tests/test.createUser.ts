import { connectDB, closeDB } from '../src/config/db';
import { User } from '../src/models/user.model';
import { Role } from '../src/types/enums';

const createUser = async () => {
  try {
    await connectDB(); // Connect to MongoDB

    const user = await User.create({
      fullname: 'John Doe',
      email: 'john@esxamplesa.com',
      password: 'securepassword',
      role: Role.USER
    });

    console.log('🎉 User created successfully:', user.toObject());
  } catch (error) {
    console.error('❌ Error creating user:', error);
  } finally {
    await closeDB(); // Close DB connection
  }
};

// 📌 Run the script
createUser();
