import { CarterSelect } from 'shyftlabs-dsl';
import type { CustomPermission } from '@/types/users';
import styles from './permissions.module.scss';

const CustomPermission: React.FC<CustomPermission> = ({
  options,
  onPermissionSelect,
  selectedPermission,
  disabled,
}) => {
  return (
    <div className={styles.customPermission}>
      {disabled ? (
        <>{selectedPermission}</>
      ) : (
        <CarterSelect
          options={options.map(item => {
            return {
              label: item,
              value: item,
            };
          })}
          disabled={disabled}
          placeholder=""
          readOnly={true}
          value={selectedPermission || options[0]}
          id="timeZoneName"
          width="100%"
          onChange={({ target: { value } }) => {
            onPermissionSelect(value);
          }}
        />
      )}
    </div>
  );
};

export default CustomPermission;
