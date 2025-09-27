import React, { useState, useEffect } from 'react';
import { Folder, ContentFile, Brand } from '@/types/content-library';
import { getFolders, getFiles } from '@/services/content-library/content-library.service';
import FileList from './file-list.component';
import CreateFolderDialog from './create-folder-dialog.component';
import FileUploadDialog from './file-upload-dialog.component';
import FilePreviewDialog from './file-preview-dialog.component';
import useAlert from '@/contexts/alert/alert.hook';
import { AlertVariant } from '@/contexts/alert/alert.provider';
import styles from '../styles/content-library.module.scss';

interface ContentLibraryProps {
  availableBrands?: Brand[];
}

const ContentLibrary: React.FC<ContentLibraryProps> = ({
  availableBrands = [], // Empty array as default - will be populated from API
}) => {
  const [currentFolder, setCurrentFolder] = useState<Folder | null>(null); // null means "All Files"
  const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<ContentFile | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [createFolderParentId, setCreateFolderParentId] = useState<number | null>(null);
  const { showAlert } = useAlert();

  const handleFolderSelect = (folder: Folder | null) => {
    console.log('Content Library - Folder selected:', folder);
    setCurrentFolder(folder);
  };

  const handleCreateFolder = (parentId: number | null) => {
    console.log('Creating folder with parentId:', parentId);
    setCreateFolderParentId(parentId);
    setShowCreateFolderDialog(true);
  };

  const handleFolderCreated = () => {
    setRefreshTrigger(prev => prev + 1);
    
    // Folder created successfully - refresh will show the new folder
    
    showAlert('Folder created successfully', AlertVariant.SUCCESS);
  };

  const handleFileUploaded = (files: ContentFile[]) => {
    setRefreshTrigger(prev => prev + 1);
    showAlert(`Uploaded ${files.length} file(s) successfully`, AlertVariant.SUCCESS);
  };

  const handleUploadClick = () => {
    console.log('Upload button clicked - currentFolder:', currentFolder);
    setShowUploadDialog(true);
  };

  const handleFileDeleted = (file: ContentFile) => {
    setRefreshTrigger(prev => prev + 1);
  };


  const handleFileEdit = (file: ContentFile) => {
    // TODO: Implement file edit functionality
    console.log('Edit file:', file);
  };

  const handleFileSelect = (file: ContentFile) => {
    setSelectedFile(file);
    setShowPreviewDialog(true);
  };

  return (
    <div className={styles.contentLibrary}>
      <div className={styles.fullWidthContent}>
        <FileList
          currentFolder={currentFolder}
          onFileSelect={handleFileSelect}
          onFileEdit={handleFileEdit}
          onFileDelete={handleFileDeleted}
          onFolderSelect={handleFolderSelect}
          onUploadClick={handleUploadClick}
          refreshTrigger={refreshTrigger}
        />
      </div>

      {/* Dialogs */}
      <CreateFolderDialog
        open={showCreateFolderDialog}
        onClose={() => {
          setShowCreateFolderDialog(false);
          setCreateFolderParentId(null);
        }}
        onSuccess={handleFolderCreated}
        parentId={createFolderParentId}
        availableBrands={availableBrands}
      />

      <FileUploadDialog
        open={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
        onSuccess={handleFileUploaded}
        currentFolder={currentFolder}
        allowAllBrands={true}
        brandIds={[]}
      />

      <FilePreviewDialog
        open={showPreviewDialog}
        onClose={() => {
          setShowPreviewDialog(false);
          setSelectedFile(null);
        }}
        file={selectedFile}
        onEdit={handleFileEdit}
        onDelete={handleFileDeleted}
      />
    </div>
  );
};

export default ContentLibrary;
