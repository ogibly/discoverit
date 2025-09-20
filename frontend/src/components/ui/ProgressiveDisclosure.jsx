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
    default: 'border-slate-200 dark:border-slate-700',
    primary: 'border-blue-200 dark:border-blue-700',
    success: 'border-green-200 dark:border-green-700'
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
      case 'completed': return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20';
      case 'current': return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20';
      case 'pending': return 'text-slate-400 bg-slate-100 dark:text-slate-500 dark:bg-slate-800';
      default: return 'text-slate-400 bg-slate-100 dark:text-slate-500 dark:bg-slate-800';
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
          <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400 mb-2">
            <span>Progress</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
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
                'border rounded-lg transition-all duration-200',
                variantClasses[variant],
                isClickable && 'hover:shadow-md cursor-pointer',
                status === 'current' && 'ring-2 ring-blue-500 ring-opacity-50',
                status === 'completed' && 'bg-green-50 dark:bg-green-900/10'
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
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                        {step.title}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
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
                        'text-slate-400'
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
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="text-sm text-slate-700 dark:text-slate-300">
                      {typeof step.details === 'string' ? (
                        <p>{step.details}</p>
                      ) : (
                        <ul className="space-y-2">
                          {step.details.map((detail, detailIndex) => (
                            <li key={detailIndex} className="flex items-start space-x-2">
                              <span className="text-blue-500 mt-1">•</span>
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
                          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors duration-200"
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
