import { v2 as cloudinary } from 'cloudinary';

/**
 * Configures Cloudinary when credentials are present.
 * Returns whether remote uploads are enabled.
 */
export function initCloudinary() {
  const name = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (name && key && secret) {
    cloudinary.config({ cloud_name: name, api_key: key, api_secret: secret });
    return { enabled: true, cloudinary };
  }
  return { enabled: false, cloudinary: null };
}

/**
 * Upload a buffer to Cloudinary (or return a dev placeholder).
 */
export async function uploadBuffer({ buffer, folder, publicId }) {
  const { enabled, cloudinary: cl } = initCloudinary();
  if (enabled && cl) {
    return new Promise((resolve, reject) => {
      const uploadStream = cl.uploader.upload_stream(
        { folder: `trustbridge/${folder}`, public_id: publicId, resource_type: 'auto' },
        (err, result) => {
          if (err) return reject(err);
          resolve({ url: result.secure_url, publicId: result.public_id });
        }
      );
      uploadStream.end(buffer);
    });
  }
  const mockId = `${folder}/${publicId || 'file'}_${Date.now()}`;
  return {
    url: `https://placeholder.local/${mockId}`,
    publicId: mockId,
    mock: true,
  };
}
