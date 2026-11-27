import {createFileRoute} from '@tanstack/react-router';
import {Auth} from '@/pages/Auth';
import {pageHead} from '@/lib/page-head';
export const Route=createFileRoute('/register')({head:()=>pageHead('Create an account', 'Create an account with Agree2Met and manage your agreements.'),component:()=> <Auth mode="register"/>});
