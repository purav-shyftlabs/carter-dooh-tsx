import React from 'react';
import { useFormik } from 'formik';
import { CarterInput, CarterSelect, CarterCheckbox, Typography } from 'shyftlabs-dsl';
import { ConfigSchemaField, IntegrationConfiguration } from '@/types/integrations';
import styles from '../styles/integrations.module.scss';

interface IntegrationConfigFormProps {
  fields: ConfigSchemaField[];
  initialValues?: Record<string, string | number | boolean>;
  onSubmit: (configurations: IntegrationConfiguration[]) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

const IntegrationConfigForm: React.FC<IntegrationConfigFormProps> = ({
  fields,
  initialValues = {},
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  // Build initial values from fields
  const formInitialValues = React.useMemo(() => {
    const values: Record<string, string | number | boolean> = {};
    fields.forEach((field) => {
      if (initialValues[field.key] !== undefined) {
        values[field.key] = initialValues[field.key];
      } else if (field.default !== undefined) {
        // Convert default value based on field type
        if (field.type === 'checkbox') {
          values[field.key] = field.default === true || field.default === 'true' || field.default === '1';
        } else if (field.type === 'number') {
          values[field.key] = typeof field.default === 'number' ? field.default : Number(field.default) || 0;
        } else {
          values[field.key] = String(field.default);
        }
      } else if (field.type === 'checkbox') {
        values[field.key] = false;
      } else if (field.type === 'number') {
        values[field.key] = undefined as any; // Allow undefined for optional numbers
      } else {
        values[field.key] = '';
      }
    });
    return values;
  }, [fields, initialValues]);

  const formik = useFormik({
    initialValues: formInitialValues,
    validateOnChange: true,
    validateOnBlur: true,
    enableReinitialize: true,
    onSubmit: (values, { setSubmitting, setTouched }) => {
      console.log('Form submitted with values:', values);
      console.log('Form errors:', formik.errors);
      console.log('Form touched:', formik.touched);
      
      // Mark all fields as touched to show errors
      const allTouched: Record<string, boolean> = {};
      fields.forEach((field) => {
        allTouched[field.key] = true;
      });
      setTouched(allTouched);
      
      // Validate again to ensure errors are shown
      formik.validateForm(values).then((errors) => {
        console.log('Validation errors:', errors);
        if (Object.keys(errors).length > 0) {
          setSubmitting(false);
          return;
        }
        
        try {
          const configurations: IntegrationConfiguration[] = Object.entries(values)
            .filter(([key]) => {
              // Only include fields that are in the schema
              return fields.some((f) => f.key === key);
            })
            .map(([key, value]) => {
              // Convert checkbox values to strings for API
              const field = fields.find((f) => f.key === key);
              if (field?.type === 'checkbox') {
                return {
                  key,
                  value: String(value),
                };
              }
              return {
                key,
                value,
              };
            });
          console.log('Sending configurations:', configurations);
          onSubmit(configurations);
        } catch (error) {
          console.error('Error submitting form:', error);
          setSubmitting(false);
        }
      });
    },
    validate: (values) => {
      const errors: Record<string, string> = {};
      console.log('Validating values:', values);
      
      fields.forEach((field) => {
        const value = values[field.key];
        console.log(`Validating field ${field.key} (${field.type}):`, value, 'required:', field.required);
        
        // Check required fields
        if (field.required) {
          if (field.type === 'checkbox') {
            // Checkboxes - if required, they just need to have a value (true/false)
            // Typically required checkboxes should be true, but we'll let the API handle this
            // No validation needed for checkbox required
          } else if (field.type === 'number') {
            // For number fields, check if it's undefined, null, empty string, or NaN
            if (
              value === undefined || 
              value === null || 
              value === '' || 
              (typeof value === 'number' && isNaN(value))
            ) {
              errors[field.key] = `${field.label} is required`;
              console.log(`  Error: ${field.key} is required (number field empty)`);
            }
          } else {
            // For string fields, check if empty or just whitespace
            if (!value || (typeof value === 'string' && value.trim() === '')) {
              errors[field.key] = `${field.label} is required`;
              console.log(`  Error: ${field.key} is required (string field empty)`, 'value:', value);
            }
          }
        }

        // Skip validation rules if field is empty and not required
        if (!field.required) {
          const isEmpty = value === undefined || value === null || value === '' || 
            (typeof value === 'number' && isNaN(value)) || 
            (typeof value === 'string' && value.trim() === '');
          if (isEmpty) {
            console.log(`  Skipping validation for optional empty field ${field.key}`);
            return; // Skip validation for optional empty fields
          }
        }

        // Validate based on field validation rules (only if value exists)
        if (field.validation && value !== undefined && value !== null && value !== '') {
          if (typeof value === 'string') {
            if (field.validation.min_length !== undefined && value.length < field.validation.min_length) {
              errors[field.key] =
                field.validation.custom_error ||
                `${field.label} must be at least ${field.validation.min_length} characters`;
              console.log(`  Error: ${field.key} too short (${value.length} < ${field.validation.min_length})`);
            }
            if (field.validation.max_length !== undefined && value.length > field.validation.max_length) {
              errors[field.key] =
                field.validation.custom_error ||
                `${field.label} must be at most ${field.validation.max_length} characters`;
              console.log(`  Error: ${field.key} too long (${value.length} > ${field.validation.max_length})`);
            }
            if (field.validation.pattern && value) {
              try {
                const regex = new RegExp(field.validation.pattern);
                if (!regex.test(value)) {
                  errors[field.key] = field.validation.custom_error || `${field.label} format is invalid`;
                  console.log(`  Error: ${field.key} pattern mismatch`, 'pattern:', field.validation.pattern, 'value:', value);
                }
              } catch (e) {
                console.error(`Invalid regex pattern for ${field.key}:`, field.validation.pattern);
              }
            }
          }
          if (typeof value === 'number' && !isNaN(value)) {
            if (field.validation.min !== undefined && value < field.validation.min) {
              errors[field.key] = field.validation.custom_error || `${field.label} must be at least ${field.validation.min}`;
              console.log(`  Error: ${field.key} too small (${value} < ${field.validation.min})`);
            }
            if (field.validation.max !== undefined && value > field.validation.max) {
              errors[field.key] = field.validation.custom_error || `${field.label} must be at most ${field.validation.max}`;
              console.log(`  Error: ${field.key} too large (${value} > ${field.validation.max})`);
            }
          }
        }

        // Validate select options
        if (field.type === 'select' && field.options && value !== undefined && value !== null && value !== '') {
          const stringValue = String(value);
          const validOptions = field.options.map((opt) => opt.value);
          if (stringValue && !validOptions.includes(stringValue)) {
            errors[field.key] = `Invalid value. Must be one of: ${validOptions.join(', ')}`;
            console.log(`  Error: ${field.key} invalid option`, 'value:', stringValue, 'valid:', validOptions);
          }
        }
      });
      
      console.log('Validation complete. Errors:', errors);
      return errors;
    },
  });

  const renderField = (field: ConfigSchemaField) => {
    // Show error if field is touched OR if there's an error and form was submitted
    const fieldError = (formik.touched[field.key] && formik.errors[field.key]) 
      ? formik.errors[field.key] 
      : formik.errors[field.key] && formik.submitCount > 0
      ? formik.errors[field.key]
      : undefined;
    const fieldValue = formik.values[field.key];

    switch (field.type) {
      case 'text':
      case 'email':
      case 'url':
        return (
          <CarterInput
            key={field.key}
            label={field.label}
            type={field.type === 'url' ? 'url' : field.type === 'email' ? 'email' : 'text'}
            value={String(fieldValue || '')}
            onChange={(e) => formik.setFieldValue(field.key, e.target.value)}
            onBlur={() => formik.setFieldTouched(field.key, true)}
            error={fieldError}
            placeholder={field.placeholder}
            required={field.required}
            disabled={isLoading}
          />
        );

      case 'password':
        return (
          <CarterInput
            key={field.key}
            label={field.label}
            type="password"
            value={String(fieldValue || '')}
            onChange={(e) => formik.setFieldValue(field.key, e.target.value)}
            onBlur={() => formik.setFieldTouched(field.key, true)}
            error={fieldError}
            placeholder={field.placeholder}
            required={field.required}
            disabled={isLoading}
          />
        );

      case 'number':
        return (
          <CarterInput
            key={field.key}
            label={field.label}
            type="number"
            value={fieldValue !== undefined && fieldValue !== null ? String(fieldValue) : ''}
            onChange={(e) => {
              const numValue = e.target.value === '' ? '' : Number(e.target.value);
              formik.setFieldValue(field.key, numValue === '' ? undefined : numValue);
            }}
            onBlur={() => formik.setFieldTouched(field.key, true)}
            error={fieldError}
            placeholder={field.placeholder}
            required={field.required}
            disabled={isLoading}
          />
        );

      case 'select':
        return (
          <CarterSelect
            key={field.key}
            label={field.label}
            value={String(fieldValue || '')}
            onChange={({ target }: { target: { value: string } }) => formik.setFieldValue(field.key, target.value)}
            errorMessage={fieldError}
            disabled={isLoading}
            options={
              field.options?.map((opt) => ({
                label: opt.label,
                value: opt.value,
              })) || []
            }
            placeholder={field.placeholder || `Select ${field.label}`}
            width="100%"
          />
        );

      case 'checkbox':
        return (
          <div key={field.key} className={styles.checkboxField}>
            <CarterCheckbox
              label={field.label}
              checked={Boolean(fieldValue)}
              onChange={(checked) => formik.setFieldValue(field.key, checked)}
              disabled={isLoading}
            />
            {fieldError && <div className={styles.fieldError}>{fieldError}</div>}
          </div>
        );

      case 'textarea':
        return (
          <div key={field.key} className={styles.textareaField}>
            <label className={styles.fieldLabel}>
              {field.label}
              {field.required && <span className={styles.required}>*</span>}
            </label>
            <textarea
              value={String(fieldValue || '')}
              onChange={(e) => formik.setFieldValue(field.key, e.target.value)}
              onBlur={() => formik.setFieldTouched(field.key, true)}
              placeholder={field.placeholder}
              required={field.required}
              disabled={isLoading}
              className={styles.textarea}
            />
            {field.help_text && <div className={styles.helpText}>{field.help_text}</div>}
            {fieldError && <div className={styles.fieldError}>{fieldError}</div>}
          </div>
        );

      default:
        return null;
    }
  };

  // Group fields by category
  const groupedFields = React.useMemo(() => {
    const groups: Record<string, ConfigSchemaField[]> = {
      auth: [],
      preference: [],
      config: [],
      other: [],
    };
    fields.forEach((field) => {
      const category = field.category || 'other';
      if (groups[category]) {
        groups[category].push(field);
      } else {
        groups.other.push(field);
      }
    });
    return groups;
  }, [fields]);

  const renderFieldGroup = (category: string, categoryFields: ConfigSchemaField[]) => {
    if (categoryFields.length === 0) return null;

    const categoryLabels: Record<string, string> = {
      auth: 'Authentication',
      preference: 'Preferences',
      config: 'Configuration',
      other: 'Settings',
    };

    return (
      <div key={category} className={styles.fieldGroup}>
        <Typography variant="h3" className={styles.groupTitle}>
          {categoryLabels[category] || category}
        </Typography>
        {categoryFields.map((field) => (
          <div key={field.key} className={styles.fieldWrapper}>
            {renderField(field)}
            {field.help_text && field.type !== 'textarea' && (
              <div className={styles.helpText}>{field.help_text}</div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <form onSubmit={formik.handleSubmit} className={styles.configForm}>
      {renderFieldGroup('auth', groupedFields.auth)}
      {renderFieldGroup('preference', groupedFields.preference)}
      {renderFieldGroup('config', groupedFields.config)}
      {renderFieldGroup('other', groupedFields.other)}

      {Object.keys(formik.errors).length > 0 && (
        <div className={styles.errorMessage} style={{ marginBottom: '16px' }}>
          <strong>Please fix the following errors:</strong>
          <ul style={{ marginTop: '8px', marginBottom: 0, paddingLeft: '20px' }}>
            {Object.entries(formik.errors).map(([key, error]) => {
              const field = fields.find((f) => f.key === key);
              return (
                <li key={key}>
                  <strong>{field?.label || key}:</strong> {String(error)}
                </li>
              );
            })}
          </ul>
        </div>
      )}
      <div className={styles.formActions}>
        {onCancel && (
          <button type="button" onClick={onCancel} className={styles.cancelButton} disabled={isLoading || formik.isSubmitting}>
            Cancel
          </button>
        )}
        <button 
          type="submit" 
          className={styles.submitButton} 
          disabled={isLoading || formik.isSubmitting}
        >
          {isLoading || formik.isSubmitting ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>
    </form>
  );
};

export default IntegrationConfigForm;

