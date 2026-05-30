import React from 'react';
import { Label } from './Label';

interface SettingsGroupProps {
  title: string;
  children: React.ReactNode;
}

export function SettingsGroup({ title, children }: SettingsGroupProps) {
  return (
    <div className="px-[22px] pb-[22px]">
      <Label className="mb-1.5 block">{title}</Label>
      <div>{children}</div>
    </div>
  );
}
