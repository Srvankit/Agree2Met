import {createFileRoute} from '@tanstack/react-router';
import {Legal} from '@/pages/Landing';
import {pageHead} from '@/lib/page-head';
export const Route=createFileRoute('/privacy')({head:()=>pageHead('Privacy policy','Agree2Met: a considered home for digital agreements.'),component:()=> <Legal kind="privacy"/>});
