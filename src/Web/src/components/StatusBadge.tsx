import React from 'react';
import { CheckCircle2, PauseCircle } from 'lucide-react';
import { CustomerStatusName } from '../types/customer';

interface StatusBadgeProps {
  status: CustomerStatusName;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  if (status === 'Suspended') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-amber-50 text-[#D97706] border border-amber-200">
        <PauseCircle className="w-3.5 h-3.5" aria-hidden="true" />
        <span>Tạm ngưng</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-emerald-50 text-[#16A34A] border border-emerald-200">
      <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
      <span>Hoạt động</span>
    </span>
  );
};
