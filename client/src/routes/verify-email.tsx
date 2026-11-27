import {createFileRoute} from '@tanstack/react-router';
import {Auth} from '@/pages/Auth';
import {pageHead} from '@/lib/page-head';
export const Route=createFileRoute('/verify-email')({head:()=>pageHead('Verify email', 'Verify email with Agree2Met and manage your agreements.'),component:()=> <Auth mode="verify-email"/>});
