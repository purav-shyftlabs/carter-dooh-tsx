import React from 'react';
import { 
  Image, 
  MicrosoftExcelLogo, 
  FilePdf, 
  FileText, 
  FileVideo, 
  FileAudio, 
  FileZip,
  File,
  FilePpt,
  FileDoc
} from '@phosphor-icons/react';

export const getFileIcon = (contentType: string, filename?: string): React.ReactElement => {
  // Get file extension from filename as fallback
  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toLowerCase() || '';
  };

  const extension = filename ? getFileExtension(filename) : '';

  // Determine file type and return appropriate icon with color
  if (contentType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'ico'].includes(extension)) {
    return <Image size={24} color="#10B981" weight="regular" />; // Green for images
  } else if (contentType.includes('spreadsheet') || 
             contentType.includes('excel') || 
             contentType.includes('csv') ||
             ['xlsx', 'xls', 'csv', 'ods'].includes(extension)) {
    return <MicrosoftExcelLogo size={24} color="#217346" weight="regular" />; // Microsoft Excel green
  } else if (contentType.includes('pdf') || extension === 'pdf') {
    return <FilePdf size={24} color="#DC2626" weight="regular" />; // Red for PDF
  } else if (contentType.startsWith('video/') || 
             ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'].includes(extension)) {
    return <FileVideo size={24} color="#7C3AED" weight="regular" />; // Purple for videos
  } else if (contentType.startsWith('audio/') || 
             ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'].includes(extension)) {
    return <FileAudio size={24} color="#DB2777" weight="regular" />; // Pink for audio
  } else if (contentType.includes('zip') || 
             contentType.includes('rar') || 
             contentType.includes('7z') ||
             contentType.includes('tar') ||
             contentType.includes('gz') ||
             ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(extension)) {
    return <FileZip size={24} color="#F59E0B" weight="regular" />; // Orange for archives
  } else if (contentType.includes('presentation') || 
             contentType.includes('powerpoint') ||
             ['ppt', 'pptx', 'odp'].includes(extension)) {
    return <FilePpt size={24} color="#EA580C" weight="regular" />; // Orange for presentations
  } else if (contentType.includes('document') ||
             contentType.includes('word') ||
             ['doc', 'docx', 'odt', 'rtf'].includes(extension)) {
    return <FileDoc size={24} color="#2563EB" weight="regular" />; // Blue for Word documents
  } else if (contentType.startsWith('text/') || 
             ['txt', 'md', 'json', 'xml', 'html', 'css', 'js', 'ts'].includes(extension)) {
    return <FileText size={24} color="#1E40AF" weight="regular" />; // Dark blue for text files
  } else {
    return <File size={24} color="#6B7280" weight="regular" />; // Gray for unknown files
  }
};
