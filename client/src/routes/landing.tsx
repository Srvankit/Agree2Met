import {createFileRoute} from '@tanstack/react-router';
import {Landing} from '@/pages/Landing';
import {pageHead} from '@/lib/page-head';
export const Route=createFileRoute('/landing')({head:()=>pageHead('Digital agreement management','Agree2Met: a considered home for digital agreements.'),component:()=> <Landing />});
