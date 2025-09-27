# Content Library

A comprehensive file and folder management system for the DOOH platform.

## Features

### 📁 Folder Management
- **Hierarchical folder structure** with expandable tree view
- **Create folders** with brand access controls
- **Folder navigation** with breadcrumb-style navigation
- **Brand-based access control** (allow all brands or specific brands)

### 📄 File Management
- **File upload** with drag & drop support
- **Multiple file upload** with progress tracking
- **File preview** for images, videos, and audio files
- **File download** and inline serving
- **File metadata** management
- **Search and filtering** capabilities

### 🎨 User Interface
- **Modern design** using existing color scheme
- **Responsive layout** for mobile and desktop
- **Grid and list view** options
- **Real-time updates** and notifications
- **Accessibility** compliant components

## Components

### Core Components
- `ContentLibrary` - Main container component
- `FolderTree` - Hierarchical folder navigation
- `FileList` - File listing with search and filters
- `CreateFolderDialog` - Folder creation modal
- `FileUploadDialog` - File upload with drag & drop
- `FilePreviewDialog` - File preview and details

### Services
- `content-library.service.ts` - API service functions
- `demo-data.service.ts` - Demo data for development

### Types
- `content-library.d.ts` - TypeScript type definitions

## API Integration

The content library is designed to work with the following API endpoints:

### Folder Management
- `POST /folders` - Create folder
- `GET /folders` - List folders
- `GET /folders/:id` - Get folder details
- `PATCH /folders/:id` - Update folder
- `DELETE /folders/:id` - Delete folder
- `PATCH /folders/:id/brand-access` - Update brand access

### File Management
- `POST /files` - Create file metadata
- `POST /files/upload` - Upload single file
- `POST /files/upload-multiple` - Upload multiple files
- `GET /files` - List files
- `GET /files/:id` - Get file details
- `PATCH /files/:id` - Update file
- `DELETE /files/:id` - Delete file
- `GET /files/:id/download` - Download file
- `GET /files/:id/serve` - Serve file inline

## Demo Mode

When no API URL is configured, the library automatically uses demo data for development and testing purposes. This includes:

- Sample folders with hierarchical structure
- Sample files with various types (images, videos, documents)
- Demo brands for access control testing
- Full CRUD operations on demo data

## Usage

The content library is integrated into the main content module as a new tab:

```tsx
import ContentLibrary from '@/modules/content/components/content-library.component';

// The library is automatically available in the Content module
// Navigate to Content > Library tab
```

## Styling

All components use the existing design system:
- Color variables from `@/styles/colors`
- Consistent spacing and typography
- Responsive breakpoints
- Accessibility-compliant interactions

## File Types Supported

- **Images**: JPEG, PNG, GIF, BMP, WebP
- **Videos**: MP4, AVI, MOV, WMV, FLV, WebM
- **Audio**: MP3, WAV, FLAC, AAC, OGG
- **Documents**: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX
- **Archives**: ZIP, RAR

## Brand Access Control

Files and folders can be configured with:
- **Allow all brands** - Accessible to all brands
- **Specific brands** - Accessible only to selected brands

This provides fine-grained control over content visibility and access.
