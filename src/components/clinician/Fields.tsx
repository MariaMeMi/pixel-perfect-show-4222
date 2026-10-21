import {Children,cloneElement,isValidElement,useId,type ReactNode} from 'react';
export const fieldClass='w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring';
export function Field({label,children}:{label:string;children:ReactNode}){const id=useId();return <div className="space-y-1.5 text-sm font-medium"><label htmlFor={id}>{label}</label>{Children.map(children,c=>isValidElement<{id?:string}>(c)?cloneElement(c,{id}):c)}</div>}
export const today=()=>new Date().toISOString().slice(0,10);
