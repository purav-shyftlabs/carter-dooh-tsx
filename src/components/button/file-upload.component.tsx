import React, { forwardRef, useImperativeHandle, useRef, InputHTMLAttributes } from 'react';
import { Button, carterColors, Tooltip } from 'shyftlabs-dsl';
import { CloseIcon, DownloadIcon, FileIcon, InfoIcon, UploadIcon } from '@/lib/icons';
import { isValidAssetURL, parseFileName } from '@/common/helpers';
import { colors } from '@/lib/material-ui/theme';
import SecureTypography from '@/components/secure-typography/secure-typography.component';
import styles from './file-upload.module.scss';

export type TFileUploadActions = {
  triggerFileSelection: () => void;
};

interface IFileUploadButton {
  ref?: React.Ref<TFileUploadActions>;
  fileUrl?: string;
  disabled?: boolean;
  downloadUrl?: string;
  inputProps?: Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'className' | 'ref'>;
  hideDownloadIcon?: boolean;
  handleFileRemove?: () => void;
}

const FileUploadButton: React.FC<IFileUploadButton> = forwardRef<TFileUploadActions, IFileUploadButton>(
  (props, ref) => {
    const {
      fileUrl,
      downloadUrl,
      inputProps = {},
      disabled,
      hideDownloadIcon = false,
      handleFileRemove = () => {},
    } = props;
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    useImperativeHandle(
      ref,
      () => {
        return {
          triggerFileSelection: () => {
            if (fileInputRef.current) {
              fileInputRef.current.click();
              fileInputRef.current.value = '';
            }
          },
        };
      },
      [],
    );

    if (fileUrl || downloadUrl) {
      const fileName = parseFileName(fileUrl);
      return (
        <div className={styles.name_input_container} data-disabled={disabled}>
          <div className={styles.uploadedFileContainer}>
            <div className={styles.uploadedFileName}>
              <FileIcon {...(disabled && { color: colors.textColorSecondary })} />
              <SecureTypography trimLength={30}>{fileName}</SecureTypography>
            </div>
            {!disabled && (
              <div className={styles.fileActions}>
                {!hideDownloadIcon && (
                  <>
                    {isValidAssetURL(fileUrl) ? (
                      <a href={downloadUrl || fileUrl} download={fileName} target="_blank">
                        <Button variant="text-only" size="small" icon={<DownloadIcon />} />
                      </a>
                    ) : (
                      <Tooltip title="Invalid File URL">
                        <InfoIcon />
                      </Tooltip>
                    )}
                  </>
                )}
                <Button
                  variant="danger"
                  size="small"
                  icon={<CloseIcon color={carterColors['red-700']} />}
                  onClick={() => handleFileRemove()}
                />
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className={styles.container}>
        <Button
          label="Choose a file"
          variant="secondary"
          disabled={disabled}
          size="small"
          iconPosition="left"
          className={styles.upload_button}
          onClick={() => fileInputRef.current?.click?.()}
          icon={<UploadIcon />}
        />
        <input
          data-testid="fileUploadInput"
          type="file"
          accept="image/*"
          className={styles.fileInput}
          ref={fileInputRef}
          {...inputProps}
        />
      </div>
    );
  },
);

FileUploadButton.displayName = 'FileUploadButton';

export default FileUploadButton;
