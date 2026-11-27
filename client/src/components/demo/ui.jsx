import {useEffect,useRef} from 'react';
import {Check, Clock3, CircleDashed, Send, PenLine, X, CircleX, AlertCircle, MoreHorizontal, Inbox} from 'lucide-react';
import s from './ui.module.css';
export function Button({children,variant='default',icon:Icon=undefined,className='',...props}){return <button type="button" className={`${s.button} ${s[variant]??''} ${className}`} {...props}>{Icon&&<Icon size={16}/>} {children}</button>}
export function IconButton({icon:Icon,label,...props}){return <Button variant="ghost" className={s.icon} title={label} aria-label={label} {...props}><Icon size={18}/></Button>}
export function Input({label,...props}){return <label className={s.field}>{label}<input className={s.input} {...props}/></label>}
export function Textarea({label,...props}){return <label className={s.field}>{label}<textarea className={s.input} {...props}/></label>}
export function Select({label,options,children,...props}){return <label className={s.field}>{label}<select className={s.input} {...props}>{options?.map(o=><option key={typeof o==='string'?o:o.value} value={typeof o==='string'?o:o.value}>{typeof o==='string'?o:o.label}</option>)}{children}</select></label>}
const icons={'Draft':CircleDashed,'Pending Review':Clock3,'Sent':Send,'Awaiting Signatures':Clock3,'Partially Signed':PenLine,'Completed':Check,'Rejected':CircleX,'Cancelled':X,'Expired':AlertCircle};
export function Badge({status}){const Icon=icons[status]??CircleDashed;return <span className={`${s.badge} ${s[status?.toLowerCase().replaceAll(' ','')]??s.draft}`}><Icon/>{status}</span>}
export function Modal({open,onClose,title,children,drawer=false}){const ref=useRef(null);useEffect(()=>{if(open)ref.current?.showModal();else ref.current?.close();},[open]);return <dialog ref={ref} className={`${s.dialog} ${drawer?s.drawer:''}`} onCancel={onClose} onClick={e=>{if(e.target===ref.current)onClose();}} aria-label={title}><div className={s.dialogHeader}><h2>{title}</h2><IconButton icon={X} label="Close" onClick={onClose}/></div><div className={s.dialogBody}>{children}</div></dialog>}
export function Tabs({items,value,onChange}){return <div className={s.tabs} role="tablist">{items.map(item=><button className={`${s.tab} ${value===item?s.active:''}`} key={item} role="tab" aria-selected={value===item} onClick={()=>onChange(item)}>{item}</button>)}</div>}
export function EmptyState({title='No agreements found',text='Try a different search or filter.',children}){return <div className={s.empty}><Inbox size={32} strokeWidth={1.3}/><h3>{title}</h3><p>{text}</p>{children}</div>}
export function Skeleton(){return <div className={s.skeleton} aria-label="Loading"/>}
export function Menu({children}){return <details className={s.menu}><summary aria-label="More actions"><MoreHorizontal size={18}/></summary><div className={s.menuList} onClick={e=>e.currentTarget.closest('details')?.removeAttribute('open')}>{children}</div></details>}
export function Avatar({name='Alex Morgan'}){return <span className={s.avatar}>{name.split(' ').slice(0,2).map(n=>n[0]).join('')}</span>}
export {s as uiStyles};
