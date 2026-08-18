export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_POST_IMAGES = 4;
export const MAX_COMMENT_IMAGES = 2;
export const ACCEPTED_IMAGE_TYPES = "image/jpeg,image/png,image/gif,image/webp";
/** Rolling per-user storage budget, so one account cannot fill the disk. */
export const UPLOAD_QUOTA_BYTES = 100 * 1024 * 1024;
export const UPLOAD_QUOTA_DAYS = 30;
