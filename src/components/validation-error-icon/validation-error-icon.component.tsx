import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ValidationErrorIconProps {
  errors: string[];
}

const ValidationErrorIcon: React.FC<ValidationErrorIconProps> = ({ errors }) => {
  if (!errors || errors.length === 0) {
    return null;
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#dc2626' }}>
      <AlertCircle size={14} />
      <span style={{ fontSize: '12px' }}>{errors.length} error{errors.length > 1 ? 's' : ''}</span>
    </div>
  );
};

export default ValidationErrorIcon;
