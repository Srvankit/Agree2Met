import {createFileRoute} from '@tanstack/react-router';
import {WorkspacePage} from '@/pages/WorkspacePage';
import {pageHead} from '@/lib/page-head';
export const Route=createFileRoute('/')({head:()=>pageHead('Your agreement workspace','Track, create and sign agreements in the Agree2Met demo workspace.'),component:Index});
function Index(){return <WorkspacePage/>;}
