import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: Bun.env.CLOUDINARY_APP_NAME,
  api_key: Bun.env.CLOUDINARY_API_KEY,
  api_secret: Bun.env.CLOUDINARY_API_SECRET,
});

console.log('Cloudinary configured successfully.');

export default cloudinary;