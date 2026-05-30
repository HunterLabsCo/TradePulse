import React from 'react';
import { Trade } from '@/lib/sample-data';
import { Pnl } from './Pnl';

interface TradeRowProps {
  trade: Trade;
  last?: boolean;
}

export function TradeRow({ trade, last = false }: TradeRowProps) {
  const pnl = trade.finalPnl ?? null;
  const isOpen = trade.status === 'open';
  const isInterrupted = trade.interruptionStatus === 'interrupted';
  const dotColor = pnl === null ? '#8ec2dd' : pnl > 0 ? '#a8d4ad' : '#e89a8a';

  return (
    <div className={`flex items-center gap-[14px] py-[14px] ${!last ? 'border-b border-[#222a25]' : ''}`}>
      {/* Status dot */}
      <div
        className="flex-shrink-0 rounded-[3px]"
        style={{ width: 6, height: 6, background: dotColor }}
      />
      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="font-sans text-[16px] font-medium text-[#d8e0d2] tracking-[-0.01em] truncate">
            {trade.tokenName}
          </span>
          {isInterrupted && (
            <span className="font-mono text-[9px] text-[#e89a8a] tracking-[0.1em] flex-shrink-0">
              INT
            </span>
          )}
        </div>
        <div className="font-mono text-[10.5px] text-[#7a8a75] mt-0.5 truncate">
          {[trade.setupType, trade.entryMarketCap].filter(Boolean).join(' · ')}
        </div>
      </div>
      {/* PnL */}
      <Pnl pnl={isOpen ? null : pnl} size="md" />
    </div>
  );
}
