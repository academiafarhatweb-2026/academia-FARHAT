const CLOUDINARY_UPLOAD = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.+)$/;

// Uploads are stored at their original size (often multi-MB phone photos).
// For Cloudinary URLs this asks for a resized copy in the best format the
// browser supports (WebP/AVIF) at automatic quality — usually 10x smaller.
// `width` is the largest size the image is shown at; `blur` gives a tiny
// pre-blurred copy for decorative backgrounds; `trimEdges` cuts 3% off each
// side first, removing stray lines or frames that screenshots and cropped
// catalog photos often carry along their borders.
// Render these with crossOrigin="anonymous": the request then carries no
// cookies, so browser tracking prevention (Edge) has nothing to block or warn about.
export function assetUrl(path, { width, blur = false, trimEdges = false } = {}) {
  if (!path) return '';
  if (!/^https?:\/\//.test(path)) return path;

  const match = path.match(CLOUDINARY_UPLOAD);
  if (!match) return path;

  const transforms = ['f_auto', 'q_auto'];
  if (blur) transforms.push('w_60', 'e_blur:800');
  else if (width) transforms.push(`w_${width}`, 'c_limit');
  const trim = trimEdges ? 'c_crop,w_0.94,h_0.94/' : '';
  return `${match[1]}${trim}${transforms.join(',')}/${match[2]}`;
}
