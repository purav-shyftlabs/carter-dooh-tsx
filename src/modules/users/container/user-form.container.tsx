import React from 'react';
import { Field, useFormik } from 'formik';
import * as yup from 'yup';
import { useRouter } from 'next/router';
import InternalLayout from '@/layouts/internal-layout/internal-layout';
import PageHeader from '@/components/page-header/page-header.component';
import { Button as CarterButton, CarterInput, CarterRadioGroup, CarterSelect } from 'shyftlabs-dsl';
import useUser from '@/contexts/user-data/user-data.hook';
import ROUTES from '@/common/routes';
import useAlert from '@/contexts/alert/alert.hook';
import { AlertVariant } from '@/contexts/alert/alert.provider';
import { AccessLevel, PermissionType, UserType } from '@/types';
import styles from '../styles/user-form.module.scss';
import { checkAclFromState } from '@/common/acl';
import { useAppSelector } from '@/redux/hooks';
import RolesPermissionsComponent from '@/components/roles-permissions-component/roles-permissions.component';
import { USER_ROLE, USER_TYPE as CONST_USER_TYPE } from '@/common/constants';
import UsersService, { CreateUserPayload, UpdateUserPayload } from '@/services/users/users.service';

const validationSchema = yup.object().shape({
  firstName: yup.string().trim().required('Please enter first name'),
  lastName: yup.string().trim().required('Please enter last name'),
  email: yup
    .string()
    .trim()
    .email('Please enter valid email')
    .required('Please enter email'),
  timeZoneName: yup.string().trim().required('Please select timezone'),
  userType: yup.mixed<UserType>().oneOf([UserType.Advertiser, UserType.Publisher]).required('Please select type'),
  allowAllAdvertisers: yup.boolean().optional(),
  brands: yup.string().when(['userType', 'allowAllAdvertisers'], {
    is: (userType: UserType, allowAllAdvertisers: boolean) =>
      userType === UserType.Advertiser || (userType === UserType.Publisher && allowAllAdvertisers === false),
    then: schema => schema.trim().required('Please select at least one brand'),
    otherwise: schema => schema.optional(),
  }),
});

const UserForm: any = () => {
  const router = useRouter();
  const { user: loggedInUser, isAdvertiser, permission } = useUser();
  const { showAlert } = useAlert();
  const usersService = new UsersService();

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
      firstName: '',
      lastName: '',
      email: '',
      timeZoneName: 'UTC',
      userType: isAdvertiser ? UserType.Advertiser : UserType.Publisher,
      allowAllAdvertisers: true,
      brands: '',
      roleType: isAdvertiser ? USER_ROLE.SUPER_USER : USER_ROLE.OPERATOR_USER,
      permissions: {} as Record<string, string>,
    },
    validationSchema,
    onSubmit: async values => {
      try {
        // Transform permissions object to array format
        const mapPermissionLevel = (level: string) => {
          switch (level) {
            case 'View and Edit':
            case 'Full Access':
            case 'Comprehensive Level':
            case 'All Levels':
              return 'FULL_ACCESS';
            case 'View Only':
              return 'VIEW_ACCESS';
            case 'Campaign Level':
              return 'CAMPAIGN_LEVEL';
            case 'Manage Wallet':
              return 'MANAGE_WALLET';
            case 'Creative Requests':
              return 'CREATIVE_REQUESTS';
            case 'All Requests':
              return 'ALL_REQUESTS';
            case 'No Access':
            default:
              return 'NO_ACCESS';
          }
        };

        const permissionsArray = values.permissions 
          ? Object.entries(values.permissions as Record<string, string>)
              .filter(([permissionType]) =>
                [PermissionType.UserManagement, PermissionType.AccountSetup].includes(
                  permissionType as PermissionType
                )
              )
              .map(([permissionType, accessLevel]) => ({
                permissionType,
                accessLevel: mapPermissionLevel(String(accessLevel ?? 'No Access')),
              }))
          : [];

        const id = router.query.id as string | undefined;
        if (id) {
          // Update flow: only send fields supported by PATCH
          const updatePayload: UpdateUserPayload = {
            name: `${values.firstName} ${values.lastName}`,
            roleType: values.roleType,
            permissions: permissionsArray,
          };
          await usersService.updateUser(id, updatePayload);
          showAlert('User updated successfully', AlertVariant.SUCCESS);
          router.push(ROUTES.USERS.LIST);
        } else {
          // Create flow
          const payload: CreateUserPayload = {
            name: `${values.firstName} ${values.lastName}`,
            firstName: values.firstName,
            lastName: values.lastName,
            email: values.email,
            timezoneName: values.timeZoneName,
            userType: values.userType,
            roleType: values.roleType,
            allowAllBrands: values.userType === UserType.Advertiser ? false : values.allowAllAdvertisers,
            allowAllBrandsList: values.brands ? values.brands.split(',').map(brand => brand.trim()) : [],
            permissions: permissionsArray,
          };
          await usersService.createUser(payload);
          showAlert('User created successfully', AlertVariant.SUCCESS);
          router.push(ROUTES.USERS.LIST);
        }
      } catch (error) {
        console.error('Error submitting user form:', error);
        showAlert('Failed to submit user form. Please try again.', AlertVariant.ERROR);
      }
    },
  });

  // Load user data for edit mode
  React.useEffect(() => {
    const id = router.query.id as string | undefined;
    if (!id) return;

    const reverseMapPermissionLevel = (apiLevel: string): string => {
      switch (apiLevel) {
        case 'FULL_ACCESS':
          return 'View and Edit';
        case 'VIEW_ACCESS':
          return 'View Only';
        case 'CAMPAIGN_LEVEL':
          return 'Campaign Level';
        case 'MANAGE_WALLET':
          return 'Manage Wallet';
        case 'CREATIVE_REQUESTS':
          return 'Creative Requests';
        case 'ALL_REQUESTS':
          return 'All Requests';
        case 'NO_ACCESS':
        default:
          return 'No Access';
      }
    };

    const loadUser = async () => {
      try {
        const u = await usersService.getUserById(id);
        const name: string = String(u?.name ?? '').trim();
        const [firstName, ...rest] = name.split(' ');
        const lastName = rest.join(' ');

        // Build permissions object expected by RolesPermissionsComponent
        const permissionsFromApiArr = Array.isArray(u?.permissions) ? u.permissions : [];
        const permissionsObj = (permissionsFromApiArr as Array<{ permissionType: string; accessLevel: string }>).
          reduce((acc: Record<string, string>, p) => {
            if (p && p.permissionType) {
              acc[p.permissionType] = reverseMapPermissionLevel(String(p.accessLevel || 'NO_ACCESS'));
            }
            return acc;
          }, {} as Record<string, string>);

        const apiRole = String(u?.roleType ?? '').toUpperCase();
        const mappedRole: string =
          apiRole === 'ADMIN'
            ? USER_ROLE.SUPER_USER
            : apiRole === 'OPERATOR_USER'
            ? USER_ROLE.OPERATOR_USER
            : apiRole === 'CUSTOM_USER'
            ? USER_ROLE.CUSTOM_USER
            : (isAdvertiser ? USER_ROLE.SUPER_USER : USER_ROLE.OPERATOR_USER);

        const mapped = {
          firstName: firstName || '',
          lastName: lastName || '',
          email: String(u?.email ?? ''),
          timeZoneName: String(u?.timezoneName ?? u?.timeZoneName ?? 'America/Los_Angeles'),
          userType: String(u?.userType ?? '').toUpperCase() === 'ADVERTISER' ? UserType.Advertiser : UserType.Publisher,
          allowAllAdvertisers: Boolean(u?.allowAllAdvertisers ?? u?.allowAllBrands ?? true),
          brands: Array.isArray(u?.allowAllBrandsList) ? String(u.allowAllBrandsList.join(', ')) : '',
          roleType: mappedRole,
          permissions: (permissionsObj as any),
        } as typeof formik.values;

        formik.resetForm({ values: mapped });
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Failed to load user for edit', e);
      }
    };

    loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.query.id]);

  console.log(formik.values,'formik.values');
  console.log(formik.errors,'formik.errors');
  console.log(formik.isValid,'formik.isValid');
  console.log(formik.dirty,'formik.dirty');
  // log 
  return (
    <form id="user_form" onSubmit={formik.handleSubmit}>
      <PageHeader
        title={router.query.id ? 'Edit User' : 'Add New User'}
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
                data-testid={router.query.id ? 'user-update-button' : 'user-submit-button'}
                variant="primary"
                type="submit"
                size="small"
                label={router.query.id ? 'Update User' : 'Create User'}
                disabled={!formik.isValid || !formik.dirty}
              />
            )}
          </div>
        )}
      />
      <div className={styles.container}>
        <section className={styles.section}>
          <div className={styles.input_wrapper}>
            <p className={styles.title}> User details </p>
            <div className={styles.grid}>
              <div className={styles.input_container}>
                <CarterInput
                  data-testid="firstName"
                  id="firstName"
                  type="text"
                  error={Boolean(formik.touched.firstName && !!formik.errors.firstName)}
                  labelProps={{ label: 'First Name *' }}
                  disabled={!hasFullAccess}
                  placeholder="Enter first name"
                  name="firstName"
                  errorMessage={formik.touched.firstName ? (formik.errors.firstName as string) ?? '' : ''}
                  value={formik.values.firstName}
                  onChange={formik.handleChange}
                />
              </div>
              <div className={styles.input_container}>
                <CarterInput
                  data-testid="lastName"
                  id="lastName"
                  type="text"
                  disabled={!hasFullAccess}
                  error={Boolean(formik.touched.lastName && !!formik.errors.lastName)}
                  labelProps={{ label: 'Last Name *' }}
                  placeholder="Enter last name"
                  name="lastName"
                  errorMessage={formik.touched.lastName ? (formik.errors.lastName as string) ?? '' : ''}
                  value={formik.values.lastName}
                  onChange={formik.handleChange}
                />
              </div>
              <div className={styles.input_container}>
                <CarterInput
                  data-testid="email"
                  id="email"
                  type="text"
                  disabled={!hasFullAccess}
                  error={Boolean(formik.touched.email && !!formik.errors.email)}
                  labelProps={{ label: 'Email Address *' }}
                  placeholder="Enter email"
                  name="email"
                  errorMessage={formik.touched.email ? (formik.errors.email as string) ?? '' : ''}
                  value={formik.values.email}
                  onChange={formik.handleChange}
                />
              </div>
              <div className={styles.input_container}>
                <CarterSelect
                  options={[
                    { label: 'UTC', value: 'UTC' }
                  ]}
                  disabled={!hasFullAccess}
                  errorMessage={formik.touched.timeZoneName ? (formik.errors.timeZoneName as string) ?? '' : ''}
                  label="Timezone"
                  placeholder="Select Timezone"
                  value={formik.values.timeZoneName}
                  id="timeZoneName"
                  width="100%"
                  onChange={({ target }) => {
                    formik.setFieldValue('timeZoneName', (target as any).value);
                  }}
                />
              </div>
            </div>
          </div>

          <div className={`${styles.input_wrapper}`}>
            <p className={styles.title}> Configure User </p>
            <div className={styles.configure_user}>
            <div className={styles.input_container}>
              <span className={styles.input_label}>User Type *</span>
              <CarterRadioGroup
                value={formik.values.userType}
                onValueChange={value =>
                  formik.setValues(prev => ({
                    ...prev,
                    userType: value,
                    allowAllAdvertisers: value === UserType.Advertiser ? false : prev.allowAllAdvertisers,
                    roleType: value === UserType.Advertiser ? USER_ROLE.SUPER_USER : USER_ROLE.OPERATOR_USER,
                  }))
                }
                options={
                  isAdvertiser
                    ? [{ label: 'Advertiser', value: UserType.Advertiser }]
                    : [
                        { label: 'Advertiser', value: UserType.Advertiser },
                        { label: 'Publisher', value: UserType.Publisher },
                      ]
                }
                radioFirst={true}
                disabled={!hasFullAccess}
                textProps={{ fontSize: '14px', fontWeight: '500', color: '#1F2B33' }}
              />
            </div>
            {formik.values.userType === UserType.Publisher && (

            <div className={styles.input_container}>
                <span className={styles.input_label}>Brand Access *</span>
                <CarterRadioGroup
                  value={formik.values.allowAllAdvertisers ? 'true' : 'false'}
                  onValueChange={newValue =>
                    formik.setValues(prev => ({
                      ...prev,
                      allowAllAdvertisers: newValue === 'true',
                      brands: '',
                    }))
                  }
                  options={[
                    { label: 'Allow all brands', value: 'true' },
                    { label: 'Allow Specific Brands', value: 'false' },
                  ]}
                  radioFirst={true}
                  disabled={!hasFullAccess}
                  textProps={{ fontSize: '14px', fontWeight: '500', color: '#1F2B33' }}
                />
              </div>
            )}
             {!formik.values.allowAllAdvertisers && (
                <div className={styles.input_container}>
                  <CarterInput
                    data-testid="brands"
                    id="brands"
                    type="text"
                    disabled={!hasFullAccess}
                    error={Boolean(formik.touched.brands && !!formik.errors.brands)}
                    labelProps={{ label: 'Brands *' }}
                    placeholder="Enter brand names (comma separated)"
                    name="brands"
                    errorMessage={formik.touched.brands ? (formik.errors.brands as string) ?? '' : ''}
                    value={formik.values.brands}
                    onChange={formik.handleChange}
                  />
                  </div>
                )}
              </div>
          </div>
          
        </section>
          {/* <section className={styles.section}>
            <div className={styles.input_wrapper}>
              <p className={styles.title}> Brand Access </p>
        
             
            </div>
          </section>
        )} */}
       
        {!!formik.values.userType && (
          <div className={styles.input_wrapper}>
            <p className={styles.title}> Roles and Permissions </p>
            <div className={styles.input_container}>
              <RolesPermissionsComponent
                userType={
                  formik.values.userType === UserType.Advertiser
                    ? CONST_USER_TYPE.ADVERTISER
                    : CONST_USER_TYPE.PUBLISHER
                }
                onUpdatePermissions={(role, permissions) => {
                  formik.setFieldValue('roleType', role);
                  formik.setFieldValue('permissions', permissions);
                }}
                defaultRole={formik.values.roleType as any}
                defaultPermissions={formik.values.permissions as any}
                disabled={!hasFullAccess}
              />
            </div>
          </div>
        )}
      </div>
    </form>
  );
};

UserForm.getLayout = (page: React.ReactNode) => <InternalLayout>{page}</InternalLayout>;    
export default UserForm;