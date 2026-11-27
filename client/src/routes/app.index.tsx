import {createFileRoute} from '@tanstack/react-router';
import {WorkspacePage} from '@/pages/WorkspacePage';
import {pageHead} from '@/lib/page-head';
export const Route=createFileRoute('/app/')({head:()=>pageHead('Dashboard','A complete overview of your Agree2Met agreements.'),component:()=> <WorkspacePage/>});
