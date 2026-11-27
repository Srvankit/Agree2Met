import {useWorkspace} from '../context/Workspace';
import {Dashboard} from './Dashboard';
import {Agreements} from './Agreements';
import {Supporting} from './Supporting';
import {Settings} from './Settings';
import {AI} from './AI';
import {Button,EmptyState,Skeleton} from '../components/demo/ui';
import s from './pages.module.css';
export function WorkspacePage({page='dashboard'}){const {error,reset,ready}=useWorkspace();if(error)return <main className={s.page}><div className={s.error} role="alert">{error}</div><Button onClick={reset}>Reset demo</Button></main>;if(!ready)return <main className={s.page}><Skeleton/></main>;if(page==='dashboard')return <Dashboard/>;if(page==='agreements'||page==='archive')return <Agreements archive={page==='archive'}/>;if(page==='settings')return <Settings/>;if(page==='ai')return <main className={s.page}><div className={s.heading}><div><h1>AI Assistant</h1><p>A thoughtful second look at your agreements.</p></div></div><AI/></main>;if(['documents','templates','deadlines','notifications','analytics','team'].includes(page))return <Supporting page={page}/>;return <main className={s.page}><EmptyState title="Page not found" text="This workspace page does not exist."/></main>}
