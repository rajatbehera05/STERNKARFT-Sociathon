import React from 'react';
import { PriorityTier, IncidentStatus, DeliveryState } from '../types';

export const PriorityBadge: React.FC<{ priority: PriorityTier }> = ({ priority }) => {
  switch (priority) {
    case 'CRITICAL':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[12px] font-semibold tracking-wide bg-[#FDF2F2] text-[#E53945] border border-[#FCD8D9]">
          <span className="w-2 h-2 rounded-full bg-[#E53945] animate-pulse" />
          Critical
        </span>
      );
    case 'HIGH':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[12px] font-semibold tracking-wide bg-[#FEF8ED] text-[#D98A00] border border-[#FDE8BF]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#D98A00]" />
          High
        </span>
      );
    case 'MEDIUM':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[12px] font-semibold tracking-wide bg-[#EFF6FF] text-[#1685D1] border border-[#BFDBFE]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1685D1]" />
          Medium
        </span>
      );
    case 'LOW':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[12px] font-semibold tracking-wide bg-[#F3F7FC] text-[#5D6F89] border border-[#DCE6F1]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#5D6F89]" />
          Low
        </span>
      );
  }
};

export const StatusBadge: React.FC<{ status: IncidentStatus }> = ({ status }) => {
  switch (status) {
    case 'NEW':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[12px] font-semibold bg-[#FDF2F2] text-[#E53945] border border-[#FCD8D9]">
          <span className="w-2 h-2 rounded-full bg-[#E53945] animate-ping" />
          New
        </span>
      );
    case 'ACKNOWLEDGED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[12px] font-semibold bg-[#FEF8ED] text-[#D98A00] border border-[#FDE8BF]">
          Acknowledged
        </span>
      );
    case 'RESPONDING':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[12px] font-semibold bg-[#EFF6FF] text-[#1685D1] border border-[#BFDBFE]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1685D1] animate-pulse" />
          In Progress
        </span>
      );
    case 'RESOLVED':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[12px] font-semibold bg-[#ECFDF5] text-[#0B9B73] border border-[#A7F3D0]">
          Resolved
        </span>
      );
  }
};

export const DeliveryStateBadge: React.FC<{ state: DeliveryState }> = ({ state }) => {
  switch (state) {
    case 'OPERATOR_ACKNOWLEDGED':
      return (
        <span className="inline-flex items-center gap-1.5 text-[13px] text-[#0B9B73] font-medium">
          <span className="w-2 h-2 rounded-full bg-[#0B9B73] shrink-0" />
          Acknowledged
        </span>
      );
    case 'PERSISTED_LOCALLY':
      return (
        <span className="inline-flex items-center gap-1.5 text-[13px] text-[#1685D1] font-medium">
          <span className="w-2 h-2 rounded-full bg-[#1685D1] shrink-0" />
          Persisted to Disk
        </span>
      );
    case 'GATEWAY_RECEIVED':
      return (
        <span className="inline-flex items-center gap-1.5 text-[13px] text-[#D98A00] font-medium">
          <span className="w-2 h-2 rounded-full bg-[#D98A00] shrink-0" />
          Gateway Buffer
        </span>
      );
    case 'SUBMITTED':
    case 'DRAFT':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 text-[13px] text-[#5D6F89] font-medium">
          <span className="w-2 h-2 rounded-full bg-[#94A3B8] shrink-0" />
          Submitted
        </span>
      );
  }
};

export const IncidentStatusBadge = StatusBadge;
export const DeliveryBadge = DeliveryStateBadge;

