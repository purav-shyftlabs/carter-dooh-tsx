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


const validationSchema = yup.object().shape({
  brandName: yup.string().trim().required('Please enter brand name'),
  description: yup.string().trim().required('Please enter description'),
  industry: yup.string().trim().required('Please select industry'),
  brandLogo: yup.mixed().optional(),
});

const BrandForm: React.FC & { getLayout?: (page: React.ReactNode) => React.ReactNode } = () => {
  const router = useRouter();
  const { permission } = useUser();
  const { showAlert } = useAlert();
  const [isMediaUploadOpen, setIsMediaUploadOpen] = useState(false);

  const hasFullAccessFromRedux = useAppSelector(state =>
    checkAclFromState(state, PermissionType.UserManagement, AccessLevel.FULL_ACCESS)
  );

  const flags = (permission as Record<string, unknown> | null | undefined)?.USER_MANAGEMENT as
    | Record<string, unknown>
    | null
    | undefined;
  const hasFullAccessFromFlags = Boolean(flags && (flags as { fullAccess?: boolean }).fullAccess);
  const hasFullAccess = Boolean(hasFullAccessFromRedux || hasFullAccessFromFlags);
  
  const formik = useFormik({
    initialValues: {
      brandName: '',
      description: '',
      industry: '',
      brandLogo: null as File | null,
    },
    validationSchema,
    onSubmit: async values => {
      try {
        const id = router.query.id as string | undefined;
        if (id) {
          // Update flow - you'll need to implement brand update service
          console.log('Update brand:', { id, ...values });
          showAlert('Brand updated successfully', AlertVariant.SUCCESS);
          router.push(ROUTES.BRAND.LIST);
        } else {
          // Create flow - you'll need to implement brand create service
          console.log('Create brand:', values);
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
        // You'll need to implement brand service to load brand data
        // For now, we'll use placeholder data
        const brandData = {
          brandName: 'Sample Brand',
          description: 'Sample brand description',
          industry: 'Technology',
          brandLogo: null,
        };

        formik.resetForm({ values: brandData });
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Failed to load brand for edit', e);
      }
    };

    loadBrand();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.query.id]);

  console.log(formik.values,'formik.values');
  console.log(formik.errors,'formik.errors');
  console.log(formik.isValid,'formik.isValid');
  console.log(formik.dirty,'formik.dirty');
  // log 
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
                disabled={!formik.isValid || !formik.dirty}
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
                        <img
                          src={URL.createObjectURL(formik.values.brandLogo)}
                          alt="Brand logo preview"
                          style={{
                            width: '60px',
                            height: '60px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            border: '1px solid #e0e0e0'
                          }}
                        />
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '500', color: '#1F2B33' }}>
                            {formik.values.brandLogo.name}
                          </div>
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            {(formik.values.brandLogo.size / 1024 / 1024).toFixed(2)} MB
                          </div>
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
                  data-testid="brandName"
                  id="brandName"
                  type="text"
                  error={Boolean(formik.touched.brandName && !!formik.errors.brandName)}
                  labelProps={{ label: 'Brand Name *' }}
                  disabled={!hasFullAccess}
                  placeholder="Enter brand name"
                  name="brandName"
                  errorMessage={formik.touched.brandName ? (formik.errors.brandName as string) ?? '' : ''}
                  value={formik.values.brandName}
                  onChange={formik.handleChange}
                />
              </div>
              
              <div className={styles.input_container}>
                <CarterSelect
                  options={[
                    { label: 'Technology', value: 'Technology' },
                    { label: 'E-commerce', value: 'E-commerce' },
                    { label: 'Social Media', value: 'Social Media' },
                    { label: 'Healthcare', value: 'Healthcare' },
                    { label: 'Finance', value: 'Finance' },
                    { label: 'Education', value: 'Education' },
                    { label: 'Entertainment', value: 'Entertainment' },
                    { label: 'Retail', value: 'Retail' },
                    { label: 'Manufacturing', value: 'Manufacturing' },
                    { label: 'Other', value: 'Other' }
                  ]}
                  disabled={!hasFullAccess}
                  errorMessage={formik.touched.industry ? (formik.errors.industry as string) ?? '' : ''}
                  label="Industry / Category *"
                  placeholder="Select Industry"
                  value={formik.values.industry}
                  id="industry"
                  width="100%"
                  onChange={({ target }: { target: { value: string } }) => {
                    formik.setFieldValue('industry', target.value);
                  }}
                />
              </div>
              <div className={styles.input_container}>
                <CarterInput
                  data-testid="description"
                  id="description"
                  type="text"
                  disabled={!hasFullAccess}
                  error={Boolean(formik.touched.description && !!formik.errors.description)}
                  labelProps={{ label: 'Description *' }}
                  placeholder="Enter brand description"
                  name="description"
                  errorMessage={formik.touched.description ? (formik.errors.description as string) ?? '' : ''}
                  value={formik.values.description}
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
        onUpload={(file: File) => {
          formik.setFieldValue('brandLogo', file);
          formik.setFieldTouched('brandLogo', true);
          setIsMediaUploadOpen(false);
        }}
        aspectRatio="1:1 (Square)"
      />
    </form>
  );
};

BrandForm.getLayout = (page: React.ReactNode) => <InternalLayout>{page}</InternalLayout>;    
export default BrandForm;