import {createFileRoute} from '@tanstack/react-router';
import {Legal} from '@/pages/Landing';
import {pageHead} from '@/lib/page-head';
export const Route=createFileRoute('/terms')({head:()=>pageHead('Terms of use','Agree2Met: a considered home for digital agreements.'),component:()=> <Legal kind="terms"/>});
