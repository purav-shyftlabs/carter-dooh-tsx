import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControlLabel, Checkbox, Chip, Box } from '@mui/material';
import { Button } from 'shyftlabs-dsl';
import { CreateFolderRequest, Brand } from '@/types/content-library';
import { createFolder } from '@/services/content-library/content-library.service';
import useAlert from '@/contexts/alert/alert.hook';
import { AlertVariant } from '@/contexts/alert/alert.provider';
import styles from '../styles/create-folder-dialog.module.scss';

interface CreateFolderDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  parentId?: number | null;
  availableBrands?: Brand[];
}

const validationSchema = yup.object().shape({
  name: yup.string().trim().required('Folder name is required').min(1, 'Folder name cannot be empty'),
  allowAllBrands: yup.boolean(),
  brandIds: yup.array().when('allowAllBrands', {
    is: (val: boolean) => val === false,
    then: (schema) => schema.min(1, 'Please select at least one brand'),
    otherwise: (schema) => schema,
  }),
});

const CreateFolderDialog: React.FC<CreateFolderDialogProps> = ({
  open,
  onClose,
  onSuccess,
  parentId,
  availableBrands = [],
}) => {
  const [loading, setLoading] = useState(false);
  const { showAlert } = useAlert();

  const formik = useFormik({
    initialValues: {
      name: '',
      allowAllBrands: true,
      brandIds: [] as number[],
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        
        const requestData: CreateFolderRequest = {
          name: values.name,
          parentId: parentId || null,
          allowAllBrands: values.allowAllBrands,
          brandIds: values.allowAllBrands ? [] : values.brandIds,
        };

        console.log('Creating folder with request data:', requestData);

        const response = await createFolder(requestData);
        
        if (response.status === 'success') {
          showAlert('Folder created successfully', AlertVariant.SUCCESS);
          onSuccess();
          formik.resetForm();
          onClose();
        } else {
          showAlert(response.message || 'Failed to create folder', AlertVariant.ERROR);
        }
      } catch (error) {
        console.error('Error creating folder:', error);
        showAlert('Failed to create folder', AlertVariant.ERROR);
      } finally {
        setLoading(false);
      }
    },
  });

  const handleBrandToggle = (brandId: number) => {
    const currentBrandIds = formik.values.brandIds;
    const newBrandIds = currentBrandIds.includes(brandId)
      ? currentBrandIds.filter(id => id !== brandId)
      : [...currentBrandIds, brandId];
    
    formik.setFieldValue('brandIds', newBrandIds);
  };

  const handleClose = () => {
    if (!loading) {
      formik.resetForm();
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New Folder</DialogTitle>
      <form onSubmit={formik.handleSubmit}>
        <DialogContent>
          <div className={styles.formContent}>
            <TextField
              fullWidth
              label="Folder Name"
              name="name"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.name && Boolean(formik.errors.name)}
              helperText={formik.touched.name && formik.errors.name}
              disabled={loading}
              margin="normal"
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={formik.values.allowAllBrands}
                  onChange={(e) => {
                    formik.setFieldValue('allowAllBrands', e.target.checked);
                    if (e.target.checked) {
                      formik.setFieldValue('brandIds', []);
                    }
                  }}
                  disabled={loading}
                />
              }
              label="Allow access to all brands"
            />

            {!formik.values.allowAllBrands && (
              <div className={styles.brandSelection}>
                <label className={styles.brandLabel}>Select Brands:</label>
                <Box className={styles.brandChips}>
                  {availableBrands.map((brand) => (
                    <Chip
                      key={brand.id}
                      label={brand.name}
                      clickable
                      color={formik.values.brandIds.includes(brand.id) ? 'primary' : 'default'}
                      onClick={() => handleBrandToggle(brand.id)}
                      disabled={loading}
                    />
                  ))}
                </Box>
                {formik.touched.brandIds && formik.errors.brandIds && (
                  <div className={styles.errorText}>
                    {formik.errors.brandIds}
                  </div>
                )}
              </div>
            )}

            {parentId && (
              <div className={styles.parentInfo}>
                <small>This folder will be created inside the selected parent folder.</small>
              </div>
            )}
          </div>
        </DialogContent>
        
        <DialogActions className={styles.dialogActions}>
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={loading || !formik.isValid}
            loading={loading}
          >
            Create Folder
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CreateFolderDialog;
