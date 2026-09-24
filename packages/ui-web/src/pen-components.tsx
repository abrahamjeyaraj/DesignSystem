'use client';
import * as React from 'react';

export interface DSToggleProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked: boolean; onCheckedChange: (checked: boolean) => void;
}
export function DSToggle({ checked, onCheckedChange, disabled, ...props }: DSToggleProps) {
  return <button type="button" role="switch" aria-checked={checked} disabled={disabled} onClick={() => onCheckedChange(!checked)} style={{ width:48,height:48,minWidth:48,minHeight:48,border:0,padding:0,background:'transparent',display:'grid',placeItems:'center',cursor:disabled?'not-allowed':'pointer' }} {...props}><span style={{width:38,height:22,padding:3,boxSizing:'border-box',borderRadius:9999,background:checked?'var(--color-accent)':'var(--color-border)',display:'flex',alignItems:'center',justifyContent:checked?'flex-end':'flex-start',opacity:disabled ? 0.5 : 1}}><span style={{width:16,height:16,borderRadius:9999,background:'var(--color-surface-card)'}} /></span></button>;
}
export interface DSProgressProps { value:number; tone?:'accent'|'accent-2'; label?:React.ReactNode; valueLabel?:React.ReactNode; className?:string }
export function DSProgress({value,tone='accent',label,valueLabel,className}:DSProgressProps) {
 const v=Math.min(1,Math.max(0,Number.isFinite(value)?value:0));
 return <div className={className} style={{width:'100%'}}>{(label!=null||valueLabel!=null)&&<div style={{display:'flex',justifyContent:'space-between',gap:6,marginBottom:6,fontFamily:'var(--font-body)',fontSize:13}}><span style={{color:'var(--color-muted-foreground)'}}>{label}</span><span style={{color:'var(--color-foreground)',fontWeight:600}}>{valueLabel}</span></div>}<div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(v*100)} style={{height:6,width:'100%',borderRadius:9999,background:'var(--color-surface-sand)',overflow:'hidden'}}><div style={{height:'100%',width:`${v*100}%`,borderRadius:9999,background:tone==='accent-2'?'var(--color-accent-2)':'var(--color-accent)'}} /></div></div>;
}
export interface DSInkCardProps extends React.HTMLAttributes<HTMLDivElement> { children:React.ReactNode }
export function DSInkCard({children,style,...props}:DSInkCardProps){return <div {...props} style={{background:'var(--color-ink-900)',borderRadius:20,padding:20,display:'flex',flexDirection:'column',gap:14,color:'var(--color-on-ink)',...style}}>{children}</div>}
export interface DSNudgeProps { title:React.ReactNode; subtitle?:React.ReactNode; icon:React.ReactNode; onClick:()=>void; tone?:'warn'|'alert'; className?:string }
export function DSNudge({title,subtitle,icon,onClick,tone='warn',className}:DSNudgeProps){return <button className={className} type="button" onClick={onClick} style={{width:'100%',boxSizing:'border-box',display:'flex',alignItems:'center',gap:14,textAlign:'left',padding:16,border:0,borderRadius:16,background:tone==='warn'?'var(--color-warn-bg)':'var(--color-alert-bg)',cursor:'pointer'}}><span aria-hidden="true">{icon}</span><span style={{flex:1,display:'flex',flexDirection:'column',gap:2}}><span style={{fontFamily:'var(--font-body)',fontSize:15,fontWeight:600,color:'var(--color-foreground)'}}>{title}</span>{subtitle!=null&&<span style={{fontFamily:'var(--font-body)',fontSize:13,color:'var(--color-muted-foreground)'}}>{subtitle}</span>}</span><span aria-hidden="true">›</span></button>}
