import React from 'react';
import { Label } from './Label';
export function SettingsGroup({title,children}:{title:string;children:React.ReactNode}) {
  return <div className="px-[22px] pb-[22px]"><Label className="mb-1.5 block">{title}</Label><div>{children}</div></div>;
}
