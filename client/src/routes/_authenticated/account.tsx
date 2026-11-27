import {createFileRoute} from '@tanstack/react-router';
import {Account} from '@/pages/Account';
import {pageHead} from '@/lib/page-head';
export const Route=createFileRoute('/_authenticated/account')({head:()=>pageHead('Your private account','Manage your private Agree2Met profile and account security.'),component:()=> <Account/>});
