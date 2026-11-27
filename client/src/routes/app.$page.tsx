import {createFileRoute} from '@tanstack/react-router';
import {WorkspacePage} from '@/pages/WorkspacePage';
import {pageHead} from '@/lib/page-head';
const titles:Record<string,string>={agreements:'Agreements',archive:'Archive',documents:'Documents',templates:'Templates',deadlines:'Deadlines',notifications:'Notifications',analytics:'Analytics',team:'Team',settings:'Settings',ai:'AI Assistant'};
export const Route=createFileRoute('/app/$page')({head:({params})=>pageHead(titles[params.page]??'Workspace page',`Manage ${titles[params.page]?.toLowerCase()??'your workspace'} in Agree2Met.`),component:Page});
function Page(){const {page}=Route.useParams();return <WorkspacePage page={page}/>;}
