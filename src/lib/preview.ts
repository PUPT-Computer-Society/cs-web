/**
 * Helper to convert standard Google Drive, Google Docs, Sheets, and Slides
 * sharing URLs into embeddable /preview URLs suitable for in-portal iframe display.
 */

export function getGooglePreviewUrl(
  rawUrl: string | null | undefined,
): string | null {
  if (!rawUrl) return null;
  const url = rawUrl.trim();

  // 1. Google Docs (/document/d/{ID}/...)
  // Use drive.google.com/file/d/{ID}/preview to bypass docs editor session check
  const docMatch = url.match(
    /docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/,
  );
  if (docMatch) {
    return `https://drive.google.com/file/d/${docMatch[1]}/preview`;
  }

  // 2. Google Spreadsheets (/spreadsheets/d/{ID}/...)
  const sheetMatch = url.match(
    /docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/,
  );
  if (sheetMatch) {
    return `https://drive.google.com/file/d/${sheetMatch[1]}/preview`;
  }

  // 3. Google Presentations / Slides (/presentation/d/{ID}/...)
  const slideMatch = url.match(
    /docs\.google\.com\/presentation\/d\/([a-zA-Z0-9_-]+)/,
  );
  if (slideMatch) {
    return `https://drive.google.com/file/d/${slideMatch[1]}/preview`;
  }

  // 4. Google Drive File (/file/d/{ID}/...)
  const driveFileMatch = url.match(
    /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
  );
  if (driveFileMatch) {
    return `https://drive.google.com/file/d/${driveFileMatch[1]}/preview`;
  }

  // 5. Google Drive open by ID (/open?id={ID})
  const driveIdMatch = url.match(
    /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
  );
  if (driveIdMatch) {
    return `https://drive.google.com/file/d/${driveIdMatch[1]}/preview`;
  }

  // 6. Google Drive Folder (/drive/folders/{ID} or /drive/u/0/folders/{ID})
  const folderMatch = url.match(
    /drive\.google\.com\/drive\/(?:u\/\d+\/)?folders\/([a-zA-Z0-9_-]+)/,
  );
  if (folderMatch) {
    return `https://drive.google.com/embeddedfolderview?id=${folderMatch[1]}#grid`;
  }

  // 7. Direct remote PDF URL fallback using Google Docs Viewer
  if (url.toLowerCase().endsWith(".pdf")) {
    return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
  }

  return null;
}
