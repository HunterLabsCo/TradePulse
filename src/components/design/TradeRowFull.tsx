import React from 'react';
import { Trade } from '@/lib/sample-data';
import { Pnl } from './Pnl';
function rel(ts:string){const d=Date.now()-new Date(ts).getTime(),m=Math.floor(d/60000);return m<60?`${m}m ago`:m<1440?`${Math.floor(m/60)}h ago`:`${Math.floor(m/1440)}d ago`;}
export function TradeRowFull({trade,idx,last=false}:{trade:Trade;idx:number;last?:boolean}) {
  const pnl=trade.finalPnl??null,isOpen=trade.status==='open',isInt=trade.interruptionStatus==='interrupted';
  const dot=pnl===null?'#8ec2dd':pnl>0?'#a8d4ad':'#e89a8a';
  return <div className={`flex items-center gap-[14px] py-4 ${!last?'border-b border-[#222a25]':''}`}><div className="font-mono text-[10px] text-[#7a8a75] w-[22px] text-right flex-shrink-0">{String(idx+1).padStart(2,'0')}</div><div className="flex-shrink-0 rounded-[3px]" style={{width:6,height:6,background:dot}}/><div className="flex-1 min-w-0"><div className="flex items-baseline gap-2"><span className="font-sans text-[16px] font-medium text-[#d8e0d2] tracking-[-0.01em] truncate">{trade.tokenName}</span><span className="font-mono text-[10px] text-[#7a8a75] flex-shrink-0">· {trade.chain}</span>{isInt&&<span className="font-mono text-[9px] text-[#e89a8a] tracking-[0.1em] flex-shrink-0">INT</span>}</div><div className="font-mono text-[10.5px] text-[#7a8a75] mt-0.5 truncate">{[trade.setupType,trade.entryMarketCap,rel(trade.entryTime)].filter(Boolean).join(' · ')}</div></div><Pnl pnl={isOpen?null:pnl} size="md"/></div>;
}
