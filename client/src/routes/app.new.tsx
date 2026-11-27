import {createFileRoute} from '@tanstack/react-router';
import {Wizard} from '@/pages/Wizard';
import {pageHead} from '@/lib/page-head';
export const Route=createFileRoute('/app/new')({validateSearch:(search:Record<string,unknown>):{edit?:string}=>typeof search['edit']==='string'?{edit:search['edit']}:{},head:()=>pageHead('Create an agreement','Draft a clear agreement with parties, clauses and milestones.'),component:Page});
function Page(){const {edit}=Route.useSearch();return <Wizard edit={edit}/>;}
