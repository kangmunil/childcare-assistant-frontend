const MAX_LONG_EDGE = 1080;
const JPEG_QUALITY = 0.8;
const WEBP_QUALITY = 0.8;

export const COMMUNITY_ALLOWED_UPLOAD_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
export const COMMUNITY_LEGACY_DISPLAY_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
export const COMMUNITY_ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
export const COMMUNITY_UPLOAD_ACCEPT = [
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  ...COMMUNITY_ALLOWED_IMAGE_MIME_TYPES
].join(',');

const COMMUNITY_ALLOWED_EXT_SET = new Set(COMMUNITY_ALLOWED_UPLOAD_IMAGE_EXTENSIONS);
const COMMUNITY_LEGACY_DISPLAY_EXT_SET = new Set(COMMUNITY_LEGACY_DISPLAY_IMAGE_EXTENSIONS);
const COMMUNITY_ALLOWED_MIME_SET = new Set(COMMUNITY_ALLOWED_IMAGE_MIME_TYPES);

const MIME_ALIAS_MAP = {
  'image/jpg': 'image/jpeg',
  'image/pjpeg': 'image/jpeg',
};

const MIME_TO_EXT = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
};

const EXT_TO_MIME = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
};

const normalizeMime = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return '';
  return MIME_ALIAS_MAP[normalized] || normalized;
};

const getFileExtension = (filename) => {
  const name = String(filename || '').trim();
  const dotIndex = name.lastIndexOf('.');
  if (dotIndex < 0) return '';
  return name.slice(dotIndex + 1).toLowerCase();
};

const replaceFileExtension = (filename, nextExtension) => {
  const name = String(filename || 'image').trim() || 'image';
  const dotIndex = name.lastIndexOf('.');
  const baseName = dotIndex < 0 ? name : name.slice(0, dotIndex);
  return `${baseName}.${nextExtension}`;
};

const createCanvas = (width, height) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
};

const canvasToBlob = (canvas, mimeType, quality) =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('이미지 압축 결과를 생성하지 못했어요.'));
          return;
        }
        resolve(blob);
      },
      mimeType,
      quality
    );
  });

// Frontend 1st-pass output intentionally normalizes orientation into pixels.
// Re-encoded images lose EXIF metadata by design, so backend workers should
// treat uploaded bytes as canonical orientation.
const loadImageBitmap = async (file) => {
  if (typeof createImageBitmap === 'function') {
    let bitmap;
    try {
      bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch (_) {
      // Older browsers may reject options; fallback keeps compatibility.
      bitmap = await createImageBitmap(file);
    }
    return {
      width: bitmap.width,
      height: bitmap.height,
      draw: (ctx, width, height) => {
        ctx.drawImage(bitmap, 0, 0, width, height);
      },
      cleanup: () => {
        if (typeof bitmap.close === 'function') bitmap.close();
      },
    };
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('이미지를 불러오지 못했어요.'));
      image.src = objectUrl;
    });

    return {
      width: img.naturalWidth || img.width,
      height: img.naturalHeight || img.height,
      draw: (ctx, width, height) => {
        ctx.drawImage(img, 0, 0, width, height);
      },
      cleanup: () => {},
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

const getTargetSize = (width, height, maxLongEdge) => {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new Error('이미지 크기를 확인할 수 없어요.');
  }

  const longEdge = Math.max(width, height);
  if (longEdge <= maxLongEdge) {
    return { width, height, resized: false };
  }

  const scale = maxLongEdge / longEdge;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
    resized: true,
  };
};

const createFileFromBlob = (blob, originalFile, mimeType) => {
  const outputExt = MIME_TO_EXT[mimeType] || getFileExtension(originalFile?.name) || 'jpg';
  const nextName = replaceFileExtension(originalFile?.name || 'image', outputExt);
  return new File([blob], nextName, {
    type: mimeType,
    lastModified: originalFile?.lastModified || Date.now(),
  });
};

const shouldSkipCompression = ({ extension }) => extension === 'gif';

export const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('이미지를 읽는 중 오류가 발생했습니다.'));
    reader.readAsDataURL(file);
  });

export const validateCommunityUploadFile = (file) => {
  const extension = getFileExtension(file?.name);
  const mimeType = normalizeMime(file?.type);

  if (!COMMUNITY_ALLOWED_EXT_SET.has(extension)) {
    return {
      ok: false,
      code: 'INVALID_EXTENSION',
      extension,
      mimeType,
      message: 'jpg, jpeg, png, gif, webp 형식의 이미지만 업로드할 수 있어요.',
    };
  }

  if (mimeType && !COMMUNITY_ALLOWED_MIME_SET.has(mimeType)) {
    return {
      ok: false,
      code: 'INVALID_MIME',
      extension,
      mimeType,
      message: 'jpg, jpeg, png, gif, webp 형식의 이미지만 업로드할 수 있어요.',
    };
  }

  return {
    ok: true,
    extension,
    mimeType: mimeType || EXT_TO_MIME[extension] || 'application/octet-stream',
  };
};

export const compressCommunityImage = async (file, options = {}) => {
  const validation = validateCommunityUploadFile(file);
  if (!validation.ok) {
    throw new Error(validation.message);
  }

  const { extension, mimeType } = validation;

  if (shouldSkipCompression({ extension })) {
    return {
      file,
      originalSize: file.size,
      processedSize: file.size,
      wasCompressed: false,
      skippedCompression: true,
      mimeType,
      extension,
    };
  }

  const maxLongEdge = Number.isFinite(options.maxLongEdge) ? options.maxLongEdge : MAX_LONG_EDGE;
  const imageSource = await loadImageBitmap(file);

  try {
    const targetSize = getTargetSize(imageSource.width, imageSource.height, maxLongEdge);
    const isPng = extension === 'png';
    const outputMimeType = isPng ? 'image/png' : mimeType === 'image/webp' ? 'image/webp' : 'image/jpeg';
    const outputQuality = outputMimeType === 'image/webp' ? WEBP_QUALITY : JPEG_QUALITY;

    if (isPng && !targetSize.resized) {
      return {
        file,
        originalSize: file.size,
        processedSize: file.size,
        wasCompressed: false,
        skippedCompression: true,
        mimeType,
        extension,
      };
    }

    const canvas = createCanvas(targetSize.width, targetSize.height);
    const ctx = canvas.getContext('2d', { alpha: isPng });
    if (!ctx) {
      throw new Error('이미지 압축을 위한 캔버스를 준비하지 못했어요.');
    }

    if (!isPng) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, targetSize.width, targetSize.height);
    }

    imageSource.draw(ctx, targetSize.width, targetSize.height);

    let blob;
    try {
      blob = await canvasToBlob(canvas, outputMimeType, outputQuality);
    } catch (error) {
      if (mimeType === 'image/webp') {
        blob = await canvasToBlob(canvas, 'image/jpeg', JPEG_QUALITY);
      } else {
        throw error;
      }
    }

    let actualMimeType = blob.type || outputMimeType;
    actualMimeType = normalizeMime(actualMimeType) || outputMimeType;

    if (blob.size >= file.size) {
      return {
        file,
        originalSize: file.size,
        processedSize: file.size,
        wasCompressed: false,
        skippedCompression: false,
        mimeType,
        extension,
      };
    }

    const nextFile = createFileFromBlob(blob, file, actualMimeType);
    return {
      file: nextFile,
      originalSize: file.size,
      processedSize: nextFile.size,
      wasCompressed: true,
      skippedCompression: false,
      mimeType: actualMimeType,
      extension: getFileExtension(nextFile.name),
    };
  } finally {
    imageSource.cleanup();
  }
};

export const prepareCommunityUploadFiles = async (files, options = {}) => {
  const selectedFiles = Array.from(files || []);
  const remaining = Number.isFinite(options.remaining) ? Math.max(0, options.remaining) : selectedFiles.length;
  const filesToProcess = selectedFiles.slice(0, remaining);
  const truncatedCount = Math.max(0, selectedFiles.length - filesToProcess.length);

  const accepted = [];
  const rejected = [];

  for (const file of filesToProcess) {
    const validation = validateCommunityUploadFile(file);
    if (!validation.ok) {
      rejected.push({
        name: file?.name || '파일',
        code: validation.code,
        message: validation.message,
      });
      continue;
    }

    try {
      const result = await compressCommunityImage(file, options);
      const preview = await readFileAsDataUrl(result.file);

      accepted.push({
        file: result.file,
        preview,
        originalSize: result.originalSize,
        processedSize: result.processedSize,
        wasCompressed: result.wasCompressed,
        skippedCompression: result.skippedCompression,
      });
    } catch (error) {
      rejected.push({
        name: file?.name || '파일',
        code: 'PROCESSING_FAILED',
        message: error?.message || '이미지 처리에 실패했습니다.',
      });
    }
  }

  return { accepted, rejected, truncatedCount };
};

export const buildCommunityUploadSelectionMessage = ({ rejected = [], truncatedCount = 0 } = {}) => {
  const messages = [];
  if (truncatedCount > 0) {
    messages.push('이미지는 최대 5장까지 첨부할 수 있어요.');
  }

  if (rejected.length > 0) {
    const invalidTypeRejected = rejected.filter((item) => item.code === 'INVALID_EXTENSION' || item.code === 'INVALID_MIME');
    const processingRejected = rejected.filter((item) => item.code === 'PROCESSING_FAILED');

    if (invalidTypeRejected.length > 0) {
      messages.push('jpg, jpeg, png, gif, webp 형식의 이미지만 업로드할 수 있어요.');
    }
    if (processingRejected.length > 0) {
      messages.push('일부 이미지를 처리하지 못해 제외했어요.');
    }
  }

  return messages.join(' ');
};

export const mapCommunityUploadApiErrorMessage = (error, fallbackMessage) => {
  const code = error?.code || error?.payload?.code;
  if (code === 'BOARD_017') {
    return '첨부 이미지 용량 제한을 초과했어요. 이미지 크기를 줄여 다시 시도해주세요.';
  }
  if (code === 'BOARD_018') {
    return 'jpg, jpeg, png, gif, webp 형식의 이미지만 업로드할 수 있어요.';
  }
  return error?.message || fallbackMessage;
};

export const isCommunityLegacyDisplayImageExtension = (extension) =>
  COMMUNITY_LEGACY_DISPLAY_EXT_SET.has(String(extension || '').toLowerCase());

export const getCommunityImageVariantSet = (file, role = 'detail') => {
  const variants = file?.imageVariants;
  if (!variants || typeof variants !== 'object') return null;
  return variants?.[role] && typeof variants[role] === 'object' ? variants[role] : null;
};

export const getCommunityPreferredVariantUrl = (file, role = 'detail') => {
  const variant = getCommunityImageVariantSet(file, role);
  if (!variant) return null;
  return variant.webpUrl || variant.jpegUrl || variant.pngUrl || variant.avifUrl || null;
};
