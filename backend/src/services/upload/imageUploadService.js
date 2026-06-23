/**
 * Image Upload Service
 * @purpose: Handle image uploads to Cloudinary
 */

import cloudinary from '../../config/cloudinary.js';
import { BadRequestError } from '../../utils/errors.js';

/**
 * Upload image to Cloudinary
 * @param {string} base64Image - Base64 encoded image
 * @param {string} folder - Cloudinary folder name
 * @returns {Promise<{url: string, publicId: string}>}
 */
export const uploadImageToCloudinary = async (base64Image, folder = 'chat-images') => {
    try {
        // Validate base64 format
        if (!base64Image || !base64Image.startsWith('data:image/')) {
            throw new BadRequestError('Invalid image format');
        }

        const result = await cloudinary.uploader.upload(base64Image, {
            folder: `dil_mate/${folder}`,
            resource_type: 'image',
            transformation: [
                { width: 1200, height: 1200, crop: 'limit' }, // Max dimensions
                { quality: 'auto', fetch_format: 'auto' } // Auto-optimize
            ]
        });

        return {
            url: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height,
            format: result.format,
            bytes: result.bytes
        };
    } catch (error) {
        console.error('[Cloudinary] Upload error:', error);
        throw new BadRequestError('Failed to upload image');
    }
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 */
export const deleteImageFromCloudinary = async (publicId) => {
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error('[Cloudinary] Delete error:', error);
        // Don't throw - deletion errors shouldn't break the flow
    }
};

/**
 * Validate image size and type
 * @param {string} base64Image - Base64 encoded image
 * @param {number} maxSizeMB - Maximum size in MB
 */
export const validateImage = (base64Image, maxSizeMB = 5) => {
    if (!base64Image) {
        throw new BadRequestError('Image is required');
    }

    // Check if it's a valid base64 image
    const imagePattern = /^data:image\/(jpeg|jpg|png|gif|webp);base64,/;
    if (!imagePattern.test(base64Image)) {
        throw new BadRequestError('Invalid image format. Supported: JPEG, PNG, GIF, WebP');
    }

    // Estimate size (base64 is ~33% larger than actual)
    const sizeInBytes = (base64Image.length * 3) / 4;
    const sizeInMB = sizeInBytes / (1024 * 1024);

    if (sizeInMB > maxSizeMB) {
        throw new BadRequestError(`Image size exceeds ${maxSizeMB}MB limit`);
    }

    return true;
};
