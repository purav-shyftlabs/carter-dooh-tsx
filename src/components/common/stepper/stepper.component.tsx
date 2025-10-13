import React from 'react';
import { carterColors, Typography } from 'shyftlabs-dsl';
import { BadgeCheck, CircleDashed } from 'lucide-react';
import ValidationErrorIcon from '@/components/validation-error-icon/validation-error-icon.component';
import styles from './stepper.module.scss';

export interface StepConfig {
  id: string;
  title: string;
  subSteps?: Array<{
    id: string;
    title: string;
    validated?: boolean;
    disabled?: boolean;
    validationErrors?: string[];
  }>;
}

export interface IStepperProps {
  steps: StepConfig[];
  currentStepId: string;
  completedStepIds: string[];
  currentSubStepId?: string;
  completedSubStepIds?: string[];
  disabledSubStepIds?: string[];
  validatedSubStepIds?: string[];
  handleSubStepClick?: (subStepId: string) => void;
  title?: string;
  className?: string;
}

export const Stepper: React.FC<IStepperProps> = ({
  steps,
  currentStepId,
  completedStepIds,
  currentSubStepId,
  completedSubStepIds = [],
  validatedSubStepIds = [],
  disabledSubStepIds = [],
  handleSubStepClick,
  title,
  className = '',
}) => {
  const isStepCompleted = (stepId: string) => completedStepIds.includes(stepId);
  const isStepCurrent = (stepId: string) => stepId === currentStepId;
  const isSubStepCompleted = (subStepId: string) => completedSubStepIds.includes(subStepId);
  const isSubStepCurrent = (subStepId: string) => subStepId === currentSubStepId;
  const isSubStepValidated = (subStepId: string) => validatedSubStepIds.includes(subStepId);
  const isSubStepDisabled = (subStepId: string, subStep?: { disabled?: boolean }) => {
    return subStep?.disabled || disabledSubStepIds.includes(subStepId);
  };

  const getStepStatus = (stepId: string) => {
    if (isStepCompleted(stepId)) return 'completed';
    if (isStepCurrent(stepId)) return 'current';
    return 'pending';
  };

  const getSubStepStatus = (subStepId: string) => {
    if (isSubStepDisabled(subStepId) && !currentSubStepId) return 'disabled';
    if (isSubStepValidated(subStepId)) return 'validated';
    if (isSubStepCompleted(subStepId)) return 'completed';
    if (isSubStepCurrent(subStepId)) return 'current';
    return 'pending';
  };

  const renderStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <div className={styles.step_icon_completed}>
            <BadgeCheck size={16} color="white" />
          </div>
        );
      case 'current':
        return <CircleDashed size={20} color={carterColors['brand-600']} />;
      default:
        return <CircleDashed size={20} color={carterColors['text-700']} />;
    }
  };

  return (
    <div className={`${styles.stepper} ${className}`}>
      {title && <h2 className={styles.stepperTitle}>{title}</h2>}
      
      {steps.map((step, stepIndex) => {
        const stepStatus = getStepStatus(step.id);
        const isLastStep = stepIndex === steps.length - 1;

        return (
          <div key={step.id}>
            <div className={styles.step_container}>
              {/* Main Step */}
              <div className={styles.step_item}>
                {renderStepIcon(stepStatus)}
                <div className={styles.stepContent}>
                  <Typography 
                    variant="body-bold" 
                    className={`${styles.stepTitle} ${styles[stepStatus]}`}
                  >
                    {step.title}
                  </Typography>
                </div>
              </div>

              {step.subSteps && (
                <div className={styles.subSteps_container}>
                  {step.subSteps.map((subStep, subStepIndex) => {
                    const subStepStatus = getSubStepStatus(subStep.id);
                    const isLastSubStep = subStepIndex === step.subSteps!.length - 1;
                    const isClickable =
                      isSubStepValidated(subStep.id) ||
                      isSubStepCompleted(subStep.id) ||
                      isSubStepDisabled(subStep.id) ||
                      stepStatus === 'current';

                    return (
                      <div
                        key={subStep.id}
                        className={styles.subStep_item}
                        onClick={() => isClickable && handleSubStepClick?.(subStep.id)}
                      >
                        <div className={styles.subStep_indicator}>
                          <div className={styles.sub_step_icon} data-status={subStepStatus}>
                            <div className={styles.sub_circle} data-status={subStepStatus} />
                          </div>
                          {!isLastSubStep && <div className={styles.subStepConnector} data-status={subStepStatus} />}
                        </div>
                        <div className={styles.subStepContent}>
                          <Typography 
                            variant="body-medium" 
                            className={`${styles.subStepTitle} ${styles[subStepStatus]}`}
                          >
                            {subStep.title}
                          </Typography>
                          <ValidationErrorIcon errors={subStep.validationErrors || []} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            {isLastStep ? null : <div className={styles.step_separator} />}
          </div>
        );
      })}
    </div>
  );
};
