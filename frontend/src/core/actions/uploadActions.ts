/**
 * Upload Actions - Business Logic Layer
 * @owner: Sujal (Shared - Both use)
 * @purpose: BMAD Actions for file upload workflows
 * 
 * BMAD: These are ACTIONS - business logic that uses adapters
 * - Consume: Files and upload configs
 * - Produce: Upload results
 * - Use: Cloudinary adapter
 */

import {
  uploadToCloudinary,
  uploadMultipleToCloudinary,
  UploadConfig,
  UploadResult,
} from '../adapters/cloudinary';

/**
 * BMAD MODEL: Profile Photo Upload Config
 */
const PROFILE_PHOTO_CONFIG: UploadConfig = {
  folder: 'dil_mate/profiles',
  resourceType: 'image',
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
  transformation: {
    width: 800,
    height: 800,
    crop: 'fill',
    quality: 85,
  },
};

/**
 * BMAD MODEL: Verification Document Upload Config
 */
const VERIFICATION_DOC_CONFIG: UploadConfig = {
  folder: 'dil_mate/verification',
  resourceType: 'image',
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedFormats: ['jpg', 'jpeg', 'png', 'pdf'],
  transformation: {
    quality: 90,
  },
};

/**
 * BMAD MODEL: Chat Image Upload Config
 */
const CHAT_IMAGE_CONFIG: UploadConfig = {
  folder: 'dil_mate/chat',
  resourceType: 'image',
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  transformation: {
    width: 1200,
    height: 1200,
    crop: 'limit',
    quality: 80,
  },
};

/**
 * BMAD ACTION: Upload Profile Photo
 * 
 * Pre-conditions:
 * - File is a valid image
 * - File size <= 5MB
 * 
 * Post-conditions:
 * - Image uploaded to Cloudinary
 * - Returns URL for storage in backend
 * 
 * Error states:
 * - Invalid file type
 * - File too large
 * - Upload failure
 */
export const uploadProfilePhoto = async (file: File): Promise<UploadResult> => {
  return uploadToCloudinary(file, PROFILE_PHOTO_CONFIG);
};

/**
 * BMAD ACTION: Upload Multiple Profile Photos
 */
export const uploadProfilePhotos = async (
  files: File[]
): Promise<UploadResult[]> => {
  return uploadMultipleToCloudinary(files, PROFILE_PHOTO_CONFIG);
};

/**
 * BMAD ACTION: Upload Verification Document (Aadhaar Card)
 * 
 * Pre-conditions:
 * - File is valid (image or PDF)
 * - File size <= 10MB
 * - User role is 'female'
 * 
 * Post-conditions:
 * - Document uploaded to Cloudinary
 * - Returns URL for storage in backend
 * 
 * Error states:
 * - Invalid file type
 * - File too large
 * - Upload failure
 */
export const uploadVerificationDocument = async (
  file: File
): Promise<UploadResult> => {
  return uploadToCloudinary(file, VERIFICATION_DOC_CONFIG);
};

/**
 * BMAD ACTION: Upload Chat Image
 * 
 * Pre-conditions:
 * - File is a valid image
 * - File size <= 5MB
 * 
 * Post-conditions:
 * - Image uploaded to Cloudinary
 * - Returns URL for message attachment
 * 
 * Error states:
 * - Invalid file type
 * - File too large
 * - Upload failure
 */
export const uploadChatImage = async (file: File): Promise<UploadResult> => {
  return uploadToCloudinary(file, CHAT_IMAGE_CONFIG);
};

/**
 * BMAD ACTION: Upload Multiple Chat Images
 */
export const uploadChatImages = async (
  files: File[]
): Promise<UploadResult[]> => {
  return uploadMultipleToCloudinary(files, CHAT_IMAGE_CONFIG);
};

export default {
  uploadProfilePhoto,
  uploadProfilePhotos,
  uploadVerificationDocument,
  uploadChatImage,
  uploadChatImages,
};

