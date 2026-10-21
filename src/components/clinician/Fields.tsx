import type {ReactNode} from 'react';
export const fieldClass='w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring';
export function Field({label,children}:{label:string;children:ReactNode}){return <label className="block space-y-1.5 text-sm font-medium"><span>{label}</span>{children}</label>}
export const today=()=>new Date().toISOString().slice(0,10);
