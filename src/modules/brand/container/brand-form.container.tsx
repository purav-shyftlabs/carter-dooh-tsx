import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useRouter } from 'next/router';
import InternalLayout from '@/layouts/internal-layout/internal-layout';
import PageHeader from '@/components/page-header/page-header.component';
import { Button as CarterButton, CarterInput, CarterSelect } from 'shyftlabs-dsl';
import useUser from '@/contexts/user-data/user-data.hook';
import ROUTES from '@/common/routes';
import useAlert from '@/contexts/alert/alert.hook';
import { AlertVariant } from '@/contexts/alert/alert.provider';
import { AccessLevel, PermissionType } from '@/types';
import styles from '../../users/styles/user-form.module.scss';
import { checkAclFromState } from '@/common/acl';
import { useAppSelector } from '@/redux/hooks';
import MediaUploadDialog from '../components/media-upload-dialog.component';
import { UploadIcon } from '@/lib/icons';
import BrandsService from '@/services/brands/brands.service';
import { gcpUploadService } from '@/services/gcp/gcp-upload.service';
import { useGCPSignedUrl } from '@/hooks/useGCPSignedUrl.hook';


const validationSchema = yup.object().shape({
  name: yup.string().trim().required('Please enter brand name'),
  type: yup.string().oneOf(['advertiser', 'publisher']).required('Please select type'),
  brandLogo: yup.mixed().optional(),
  publisherSharePerc: yup
    .number()
    .typeError('Publisher share must be a number')
    .min(0, 'Minimum is 0')
    .max(100, 'Maximum is 100')
    .required('Please enter publisher share %'),
  metadataCategory: yup.string().trim().required('Please enter category'),
  allowAllProducts: yup.boolean().required(),
  parentCompanyId: yup
    .number()
    .typeError('Parent Company ID must be a number')
    .nullable()
    .transform(val => (val === '' || Number.isNaN(val) ? null : val)),
  customId: yup.string().trim().optional(),
});


const BrandForm: React.FC & { getLayout?: (page: React.ReactNode) => React.ReactNode } = () => {
  const router = useRouter();
  const { permission } = useUser();
  const { showAlert } = useAlert();
  const [isMediaUploadOpen, setIsMediaUploadOpen] = useState(false);
  const [brandLogoPath, setBrandLogoPath] = useState<string | null>(null);

  const hasFullAccessFromRedux = useAppSelector(state =>
    checkAclFromState(state, PermissionType.UserManagement, AccessLevel.FULL_ACCESS)
  );

  const flags = (permission as Record<string, unknown> | null | undefined)?.USER_MANAGEMENT as
    | Record<string, unknown>
    | null
    | undefined;
  const hasFullAccessFromFlags = Boolean(flags && (flags as { fullAccess?: boolean }).fullAccess);
  const hasFullAccess = Boolean(hasFullAccessFromRedux || hasFullAccessFromFlags);
  
  // Get signed URL for brand logo viewing
  const { url: brandLogoUrl, loading: logoLoading, error: logoError } = useGCPSignedUrl(
    brandLogoPath,
    'read',
    { expirationMinutes: 10 }
  );
  
  const formik = useFormik({
    initialValues: {
      name: '',
      type: 'advertiser',
      brandLogo: null as string | null,
      publisherSharePerc: 0,
      metadataCategory: '',
      allowAllProducts: true,
      parentCompanyId: '' as unknown as number | null,
      customId: '',
    },
    validationSchema,
    onSubmit: async values => {
      try {
        const id = router.query.id as string | undefined;
        
        // Use brandLogo as assetUrl directly (it's already a string - base64 or URL)
        const assetUrl = values.brandLogo || undefined;

        const payload = {
          name: values.name,
          type: values.type,
          assetUrl,
          publisherSharePerc: Number(values.publisherSharePerc),
          metadata: { category: values.metadataCategory },
          allowAllProducts: Boolean(values.allowAllProducts),
          parentCompanyId: values.parentCompanyId ? Number(values.parentCompanyId) : undefined,
          customId: values.customId || undefined,
        };

        if (id) {
          // Update flow - call the API
          console.log('Updating brand with payload:', { id, ...payload });
          const brandsService = new BrandsService();
          const response = await brandsService.updateBrand(id, payload);
          showAlert('Brand updated successfully', AlertVariant.SUCCESS);
          router.push(ROUTES.BRAND.LIST);
        } else {
          // Create flow - call the API
          console.log('Creating brand with payload:', payload);
          const brandsService = new BrandsService();
          const response = await brandsService.createBrand(payload);
          console.log('Brand created successfully:', response);
          showAlert('Brand created successfully', AlertVariant.SUCCESS);
          router.push(ROUTES.BRAND.LIST);
        }
      } catch (error) {
        console.error('Error submitting brand form:', error);
        showAlert('Failed to submit brand form. Please try again.', AlertVariant.ERROR);
      }
    },
  });

  // Load brand data for edit mode
  React.useEffect(() => {
    const id = router.query.id as string | undefined;
    if (!id) return;

    const loadBrand = async () => {
      try {
        const brandsService = new BrandsService();
        const brand = await brandsService.getBrandById(id);
        
        const brandData = {
          name: brand.name || '',
          type: brand.type || 'advertiser',
          brandLogo: brand.assetUrl || null, // Keep as string (base64 or URL)
          publisherSharePerc: brand.publisherSharePerc || 0,
          metadataCategory: brand.metadata?.category || '',
          allowAllProducts: brand.allowAllProducts ?? true,
          parentCompanyId: brand.parentCompanyId || null,
          customId: brand.customId || '',
        } as typeof formik.values;

        formik.resetForm({ values: brandData });
      } catch (e) {
        showAlert('Failed to load brand data. Please try again.', AlertVariant.ERROR);
      }
    };

    loadBrand();
  }, [router.query.id]);

  
  return (
    <form id="brand_form" onSubmit={formik.handleSubmit}>
      <PageHeader
        title={router.query.id ? 'Edit Brand' : 'Add New Brand'}
        ActionComponent={() => (
          <div className={styles.form_action}>
            <CarterButton
              data-testid="cancel-button"
              onClick={() => router.back()}
              size="small"
              variant="text-only"
              type="button"
              label="Cancel"
            />
            {hasFullAccess && (
              <CarterButton
                data-testid={router.query.id ? 'brand-update-button' : 'brand-submit-button'}
                variant="primary"
                type="submit"
                size="small"
                label={router.query.id ? 'Update Brand' : 'Create New Brand'}
                disabled={!formik.isValid || (!formik.dirty && !router.query.id)}
              />
            )}
          </div>
        )}
      />
      <div className={styles.container}>
        <section className={styles.section}>
          <div className={styles.input_wrapper}>
            <p className={styles.title}>Brand Details</p>
            <div className={styles.input_container + ' ' + styles.brand_logo_container}>
              <div>
                <label className={styles.input_label} style={{ marginBottom: '8px', display: 'block' }}>
                  Brand Logo
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px'}}>
                  {formik.values.brandLogo ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {logoLoading ? (
                        <div style={{
                          width: '60px',
                          height: '60px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#f5f5f5',
                          borderRadius: '8px',
                          border: '1px solid #e0e0e0'
                        }}>
                          Loading...
                        </div>
                      ) : logoError ? (
                        <div style={{
                          width: '60px',
                          height: '60px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#ffebee',
                          borderRadius: '8px',
                          border: '1px solid #e0e0e0',
                          color: '#c62828',
                          fontSize: '12px'
                        }}>
                          Error
                        </div>
                      ) : (
                        <img
                          src={brandLogoUrl || (typeof formik.values.brandLogo === 'string' 
                            ? formik.values.brandLogo 
                            : URL.createObjectURL(formik.values.brandLogo))}
                          alt="Brand logo preview"
                          style={{
                            width: '60px',
                            height: '60px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            border: '1px solid #e0e0e0'
                          }}
                        />
                      )}
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '500', color: '#1F2B33' }}>
                          {typeof formik.values.brandLogo === 'string' 
                            ? 'Brand Logo' 
                            : (formik.values.brandLogo as File).name
                          }
                        </div>
                        {typeof formik.values.brandLogo === 'object' && (
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            {((formik.values.brandLogo as File).size / 1024 / 1024).toFixed(2)} MB
                          </div>
                        )}
                      </div>
                      <CarterButton
                        variant="text-only"
                        size="medium"
                        label="Remove"
                        onClick={() => {
                          formik.setFieldValue('brandLogo', null);
                          formik.setFieldTouched('brandLogo', true);
                        }}
                        disabled={!hasFullAccess}
                      />
                    </div>
                  ) : (
                    <CarterButton
                      variant="secondary"
                      size="medium"
                      label="Upload Content"
                      icon={<UploadIcon />}
                      iconPosition="left"
                      onClick={() => setIsMediaUploadOpen(true)}
                      disabled={!hasFullAccess}
                    />
                  )}
                </div>
                {formik.touched.brandLogo && formik.errors.brandLogo && (
                  <div style={{ color: '#C62828', fontSize: '12px', marginTop: '4px' }}>
                    {formik.errors.brandLogo as string}
                  </div>
                )}
              </div>
            </div>
            <div className={styles.grid}>
              <div className={styles.input_container}>
                <CarterInput
                  data-testid="name"
                  id="name"
                  type="text"
                  error={Boolean(formik.touched.name && !!formik.errors.name)}
                  labelProps={{ label: 'Brand Name *' }}
                  disabled={!hasFullAccess}
                  placeholder="Enter brand name"
                  name="name"
                  errorMessage={formik.touched.name ? (formik.errors.name as string) ?? '' : ''}
                  value={formik.values.name}
                  onChange={formik.handleChange}
                />
              </div>
              <div className={styles.input_container}>
                <CarterSelect
                  options={[
                    { label: 'Advertiser', value: 'advertiser' },
                    { label: 'Publisher', value: 'publisher' },
                  ]}
                  disabled={!hasFullAccess}
                  errorMessage={formik.touched.type ? (formik.errors.type as string) ?? '' : ''}
                  label="Type *"
                  placeholder="Select Type"
                  value={formik.values.type}
                  id="type"
                  width="100%"
                  onChange={({ target }: { target: { value: string } }) => {
                    formik.setFieldValue('type', target.value);
                  }}
                />
              </div>
              <div className={styles.input_container}>
                <CarterInput
                  data-testid="publisherSharePerc"
                  id="publisherSharePerc"
                  type="number"
                  error={Boolean(formik.touched.publisherSharePerc && !!formik.errors.publisherSharePerc)}
                  labelProps={{ label: 'Publisher Share % *' }}
                  disabled={!hasFullAccess}
                  placeholder="0 - 100"
                  name="publisherSharePerc"
                  errorMessage={formik.touched.publisherSharePerc ? (formik.errors.publisherSharePerc as string) ?? '' : ''}
                  value={formik.values.publisherSharePerc as unknown as string}
                  onChange={e => formik.setFieldValue('publisherSharePerc', e.target.value)}
                />
              </div>
              <div className={styles.input_container}>
                <CarterInput
                  data-testid="metadataCategory"
                  id="metadataCategory"
                  type="text"
                  error={Boolean(formik.touched.metadataCategory && !!formik.errors.metadataCategory)}
                  labelProps={{ label: 'Category *' }}
                  disabled={!hasFullAccess}
                  placeholder="retail"
                  name="metadataCategory"
                  errorMessage={formik.touched.metadataCategory ? (formik.errors.metadataCategory as string) ?? '' : ''}
                  value={formik.values.metadataCategory}
                  onChange={formik.handleChange}
                />
              </div>
              <div className={styles.input_container}>
                <CarterSelect
                  options={[
                    { label: 'Yes', value: 'true' },
                    { label: 'No', value: 'false' },
                  ]}
                  disabled={!hasFullAccess}
                  errorMessage={''}
                  label="Allow All Products *"
                  placeholder="Select"
                  value={formik.values.allowAllProducts ? 'true' : 'false'}
                  id="allowAllProducts"
                  width="100%"
                  onChange={({ target }: { target: { value: string } }) => {
                    formik.setFieldValue('allowAllProducts', target.value === 'true');
                  }}
                />
              </div>
              <div className={styles.input_container}>
                <CarterInput
                  data-testid="parentCompanyId"
                  id="parentCompanyId"
                  type="number"
                  error={Boolean(formik.touched.parentCompanyId && !!formik.errors.parentCompanyId)}
                  labelProps={{ label: 'Parent Company ID' }}
                  disabled={!hasFullAccess}
                  placeholder="e.g. 123"
                  name="parentCompanyId"
                  errorMessage={formik.touched.parentCompanyId ? (formik.errors.parentCompanyId as string) ?? '' : ''}
                  value={(formik.values.parentCompanyId ?? '') as unknown as string}
                  onChange={e => formik.setFieldValue('parentCompanyId', e.target.value)}
                />
              </div>
              <div className={styles.input_container}>
                <CarterInput
                  data-testid="customId"
                  id="customId"
                  type="text"
                  error={false}
                  labelProps={{ label: 'Custom ID' }}
                  disabled={!hasFullAccess}
                  placeholder="ACME-BR-02"
                  name="customId"
                  errorMessage={''}
                  value={formik.values.customId}
                  onChange={formik.handleChange}
                />
              </div>
            </div>
          </div>
        </section>
      </div>
      
      <MediaUploadDialog
        open={isMediaUploadOpen}
        onClose={() => setIsMediaUploadOpen(false)}
        onUpload={async (file: File) => {
          try {
            // Upload file using existing GCP upload service
            const gcpUrl = await gcpUploadService.uploadFile(file);
            formik.setFieldValue('brandLogo', gcpUrl);
            setBrandLogoPath(gcpUrl); // Set file path for signed URL generation
            formik.setFieldTouched('brandLogo', true);
            setIsMediaUploadOpen(false);
          } catch (error) {
            console.error('Error uploading file to GCP:', error);
            showAlert('Failed to upload image. Please try again.', AlertVariant.ERROR);
          }
        }}
        aspectRatio="1:1 (Square)"
      />
    </form>
  );
};

BrandForm.getLayout = (page: React.ReactNode) => <InternalLayout>{page}</InternalLayout>;    
export default BrandForm;