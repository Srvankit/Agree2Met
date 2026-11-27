import {createFileRoute} from '@tanstack/react-router';
import {Auth} from '@/pages/Auth';
import {pageHead} from '@/lib/page-head';
export const Route=createFileRoute('/reset-password')({head:()=>pageHead('Reset password', 'Reset password with Agree2Met and manage your agreements.'),component:()=> <Auth mode="reset-password"/>});
