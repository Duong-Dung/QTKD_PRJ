import React from 'react';
import {
  CheckCircle2,
  PauseCircle,
  Clock,
  AlertTriangle,
  XCircle,
  FileEdit,
  Send,
  ShieldCheck,
  Ban,
} from 'lucide-react';

export type AnyStatus =
  | 'Draft'
  | 'Submitted'
  | 'UnderReview'
  | 'PendingApproval'
  | 'RevisionRequested'
  | 'Approved'
  | 'Active'
  | 'Effective'
  | 'Rejected'
  | 'Cancelled'
  | 'Expired'
  | 'Suspended'
  | 'Signing'
  | 'Signed'
  | string;

interface StatusBadgeProps {
  status: AnyStatus;
  className?: string;
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  className = '',
  showIcon = true,
}) => {
  const norm = String(status || '').trim().toLowerCase();

  switch (norm) {
    case 'draft':
    case '0':
    case 'bản nháp':
    case 'soạn thảo':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200/80 ${className}`}
        >
          {showIcon && <FileEdit className="w-3.5 h-3.5 text-slate-500" />}
          <span>Bản nháp</span>
        </span>
      );

    case 'submitted':
    case 'đã gửi':
    case 'trình duyệt':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 ${className}`}
        >
          {showIcon && <Send className="w-3.5 h-3.5 text-blue-600" />}
          <span>Trình duyệt</span>
        </span>
      );

    case 'underreview':
    case 'under review':
    case 'đang rà soát':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-cyan-50 text-cyan-800 border border-cyan-200 ${className}`}
        >
          {showIcon && <Clock className="w-3.5 h-3.5 text-cyan-600 animate-pulse" />}
          <span>Đang rà soát</span>
        </span>
      );

    case 'pendingapproval':
    case 'pending approval':
    case 'chờ duyệt':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 ${className}`}
        >
          {showIcon && <Clock className="w-3.5 h-3.5 text-amber-600" />}
          <span>Chờ duyệt</span>
        </span>
      );

    case 'revisionrequested':
    case 'revision requested':
    case 'yêu cầu chỉnh sửa':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 ${className}`}
        >
          {showIcon && <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
          <span>Yêu cầu chỉnh sửa</span>
        </span>
      );

    case 'approved':
    case '2':
    case 'đã duyệt':
    case 'đã phê duyệt':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 ${className}`}
        >
          {showIcon && <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />}
          <span>Đã phê duyệt</span>
        </span>
      );

    case 'active':
    case '1':
    case 'effective':
    case 'hoạt động':
    case 'có hiệu lực':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300 ${className}`}
        >
          {showIcon && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
          <span>Hoạt động</span>
        </span>
      );

    case 'rejected':
    case 'từ chối':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-red-50 text-red-700 border border-red-200 ${className}`}
        >
          {showIcon && <XCircle className="w-3.5 h-3.5 text-red-600" />}
          <span>Từ chối</span>
        </span>
      );

    case 'suspended':
    case 'tạm ngưng':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 ${className}`}
        >
          {showIcon && <PauseCircle className="w-3.5 h-3.5 text-amber-600" />}
          <span>Tạm ngưng</span>
        </span>
      );

    case 'cancelled':
    case 'expired':
    case 'hết hiệu lực':
    case 'đã hủy':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200 line-through ${className}`}
        >
          {showIcon && <Ban className="w-3.5 h-3.5 text-slate-400" />}
          <span>Hết hiệu lực</span>
        </span>
      );

    default:
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 ${className}`}
        >
          <span>{status}</span>
        </span>
      );
  }
};
