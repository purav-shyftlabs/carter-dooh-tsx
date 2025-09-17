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
import { CloseIcon, PencilIcon, UploadIcon } from '@/lib/icons';
import { DeleteIcon, TrashIcon } from 'lucide-react';


const validationSchema = yup.object().shape({
  contentName: yup.string().trim().required('Please enter brand name'),
  contentDescription: yup.string().trim().optional(),
  brand: yup.string().trim().required('Please select brand'),
  contentLogo: yup.mixed().required('Please upload content logo'),
});

const ContentForm: React.FC & { getLayout?: (page: React.ReactNode) => React.ReactNode } = () => {
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
      contentName: '',
      contentDescription: '',
      brand: '',
      contentType: '',
      contentLogo: null as File | null,
    },
    validationSchema,
    onSubmit: async values => {
      try {
        const id = router.query.id as string | undefined;
        if (id) {
          // Update flow - you'll need to implement brand update service
          console.log('Update content:', { id, ...values });
          showAlert('Brand updated successfully', AlertVariant.SUCCESS);
          router.push(ROUTES.CONTENT.LIST);
        } else {
          // Create flow - you'll need to implement brand create service
          console.log('Create content:', values);
          showAlert('Brand created successfully', AlertVariant.SUCCESS);
          router.push(ROUTES.CONTENT.LIST);
        }
      } catch (error) {
        console.error('Error submitting content form:', error);
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
        const contentData = {
          contentName: 'Sample Content',
          contentDescription: 'Sample content description',
          brand: 'Technology',
          contentType: 'Technology',
          contentLogo: null,
        };

        formik.resetForm({ values: contentData });
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Failed to load content for edit', e);
      }
    };

    loadBrand();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.query.id]);

  console.log(formik.values, 'formik.values');
  console.log(formik.errors, 'formik.errors');
  console.log(formik.isValid, 'formik.isValid');
  console.log(formik.dirty, 'formik.dirty');
  // log 
  return (
    <form id="content_form" onSubmit={formik.handleSubmit}>
      <PageHeader
        title={router.query.id ? 'Edit Content' : 'Add New Content'}
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
                data-testid={router.query.id ? 'content-update-button' : 'content-submit-button'}
                variant="primary"
                type="submit"
                size="small"
                label={router.query.id ? 'Update Content' : 'Create New Content'}
                disabled={!formik.isValid || !formik.dirty}
              />
            )}
          </div>
        )}
      />
      <div className={styles.container}>
        <section className={styles.section}>
          <div className={styles.input_wrapper}>
            <p className={styles.title}>Content Details</p>
            <div className={styles.grid}>



              <div className={styles.input_container}>
                <CarterInput
                  data-testid="contentName"
                  id="contentName"
                  type="text"
                  error={Boolean(formik.touched.contentName && !!formik.errors.contentName)}
                  labelProps={{ label: 'Content Name *' }}
                  disabled={!hasFullAccess}
                  placeholder="Enter content name"
                  name="contentName"
                  errorMessage={formik.touched.contentName ? (formik.errors.contentName as string) ?? '' : ''}
                  value={formik.values.contentName}
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
                  errorMessage={formik.touched.brand ? (formik.errors.brand as string) ?? '' : ''}
                  label="Brand *"
                  placeholder="Select Brand"
                  value={formik.values.brand}
                  id="brand"
                  width="100%"
                  onChange={({ target }: { target: { value: string } }) => {
                    formik.setFieldValue('brand', target.value);
                  }}
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
                  errorMessage={formik.touched.contentType ? (formik.errors.contentType as string) ?? '' : ''}
                  label="Content Type *"
                  placeholder="Select Content Type"
                  value={formik.values.contentType}
                  id="contentType"
                  width="100%"
                  onChange={({ target }: { target: { value: string } }) => {
                    formik.setFieldValue('contentType', target.value);
                  }}
                />
              </div>
              <div className={styles.input_container}>
                <CarterInput
                  data-testid="contentDescription"
                  id="contentDescription"
                  type="text"
                  disabled={!hasFullAccess}
                  error={Boolean(formik.touched.contentDescription && !!formik.errors.contentDescription)}
                  labelProps={{ label: 'Description (Optional)' }}
                  placeholder="Enter content description"
                  name="description"
                  errorMessage={formik.touched.contentDescription ? (formik.errors.contentDescription as string) ?? '' : ''}
                  value={formik.values.contentDescription}
                  onChange={formik.handleChange}
                />
              </div>
              <div className={styles.input_container}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px',justifyContent: 'space-between' }}>

                <label className={styles.input_label} style={{ marginBottom: '8px', display: 'block' }}>
                  Content Logo
                </label>
               {formik.values.contentLogo && <div style={{ display: 'flex', alignItems: 'right', justifyContent: 'right', gap: '12px' }}>
                  <CarterButton
                    variant="tertiary"
                    size="small"
                    label="Edit"
                    icon={<PencilIcon style={{ width: '16px', height: '16px' }} />}
                    iconPosition="left"
                    onClick={() => {
                      formik.setFieldValue('contentLogo', null);
                      formik.setFieldTouched('contentLogo', true);
                      setIsMediaUploadOpen(true);
                    }}
                    disabled={!hasFullAccess}
                  />
                  <CarterButton
                    variant="danger"
                    icon={<TrashIcon style={{ width: '16px', height: '16px' }} />}
                    size="small"
                    iconPosition="left"
                    label="Remove"
                    onClick={() => {
                      formik.setFieldValue('contentLogo', null);
                      formik.setFieldTouched('contentLogo', true);
                    }}
                    disabled={!hasFullAccess}
                  />
                </div>}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>

                  {formik.values.contentLogo ? (
                    <div>
                      <img
                        src={URL.createObjectURL(formik.values.contentLogo)}
                        alt="Brand logo preview"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          borderRadius: '8px',
                        }}
                      />
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '500', color: '#1F2B33' }}>
                          {formik.values.contentLogo.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          {(formik.values.contentLogo.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>

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
                {formik.touched.contentLogo && formik.errors.contentLogo && (
                  <div style={{ color: '#C62828', fontSize: '12px', marginTop: '4px' }}>
                    {formik.errors.contentLogo as string}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      <MediaUploadDialog
        open={isMediaUploadOpen}
        onClose={() => setIsMediaUploadOpen(false)}
        onUpload={(file: File) => {
          formik.setFieldValue('contentLogo', file);
          formik.setFieldTouched('contentLogo', true);
          setIsMediaUploadOpen(false);
        }}
      // aspectRatio="1:1 (Square)"
      />
    </form>
  );
};

ContentForm.getLayout = (page: React.ReactNode) => <InternalLayout>{page}</InternalLayout>;
export default ContentForm;