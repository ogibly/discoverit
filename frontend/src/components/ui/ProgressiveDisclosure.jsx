import React, { useState } from 'react';
import { cn } from '../../utils/cn';

const ProgressiveDisclosure = ({ 
  steps = [],
  currentStep = 0,
  onStepChange,
  variant = 'default',
  showProgress = true,
  className = '',
  ...props 
}) => {
  const [expandedStep, setExpandedStep] = useState(currentStep);

  const variantClasses = {
    default: 'border-border',
    primary: 'border-primary/20',
    success: 'border-success/20'
  };

  const getStepStatus = (stepIndex) => {
    if (stepIndex < currentStep) return 'completed';
    if (stepIndex === currentStep) return 'current';
    return 'pending';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return '✓';
      case 'current': return '→';
      case 'pending': return '○';
      default: return '○';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-success bg-success/10';
      case 'current': return 'text-primary bg-primary/10';
      case 'pending': return 'text-muted-foreground bg-muted';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const progressPercentage = steps.length > 0 ? ((currentStep + 1) / steps.length) * 100 : 0;

  return (
    <div 
      className={cn(
        'space-y-4',
        className
      )}
      {...props}
    >
      {showProgress && (
        <div className="mb-6">
          <div className="flex justify-between text-body text-muted-foreground mb-2">
            <span>Progress</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      )}

      <div className="space-y-3">
        {steps.map((step, index) => {
          const status = getStepStatus(index);
          const isExpanded = expandedStep === index;
          const isClickable = status === 'current' || status === 'completed';

          return (
            <div
              key={index}
              className={cn(
                'border rounded-lg transition-all duration-200 bg-card',
                variantClasses[variant],
                isClickable && 'hover:shadow-md cursor-pointer',
                status === 'current' && 'ring-2 ring-primary/50',
                status === 'completed' && 'bg-success/5'
              )}
              onClick={() => {
                if (isClickable) {
                  setExpandedStep(isExpanded ? -1 : index);
                  onStepChange?.(index);
                }
              }}
            >
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                      getStatusColor(status)
                    )}>
                      {getStatusIcon(status)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {step.title}
                      </h3>
                      <p className="text-body text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {step.icon && (
                      <span className="text-2xl">{step.icon}</span>
                    )}
                    <svg
                      className={cn(
                        'w-5 h-5 transition-transform duration-200',
                        isExpanded ? 'rotate-180' : 'rotate-0',
                        'text-muted-foreground'
                      )}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {isExpanded && step.details && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="text-body text-foreground">
                      {typeof step.details === 'string' ? (
                        <p>{step.details}</p>
                      ) : (
                        <ul className="space-y-2">
                          {step.details.map((detail, detailIndex) => (
                            <li key={detailIndex} className="flex items-start space-x-2">
                              <span className="text-primary mt-1">•</span>
                              <span>{detail}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    
                    {step.action && (
                      <div className="mt-4">
                        <button
                          type="button"
                          className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors duration-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            step.action();
                          }}
                        >
                          {step.actionText || 'Take Action'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export { ProgressiveDisclosure };
export default ProgressiveDisclosure;