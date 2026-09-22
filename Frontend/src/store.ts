import { create } from 'zustand';
import axios from 'axios';
export const api=axios.create({baseURL:import.meta.env.VITE_API_URL??'http://localhost:3000/api'});
type User={id:string;email:string;role:string;fullName?:string};type State={token:string|null;user:User|null;setSession:(token:string,user:User)=>void;logout:()=>void};
export const useAuth=create<State>(set=>({token:localStorage.getItem('token'),user:JSON.parse(localStorage.getItem('user')??'null'),setSession:(token,user)=>{localStorage.setItem('token',token);localStorage.setItem('user',JSON.stringify(user));set({token,user})},logout:()=>{localStorage.removeItem('token');localStorage.removeItem('user');set({token:null,user:null})}}));
api.interceptors.request.use(config=>{const token=useAuth.getState().token;if(token)config.headers.Authorization=`Bearer ${token}`;return config});
export const errorMessage=(error:any)=>error?.response?.data?.message?.join?.(', ')??error?.response?.data?.message??'Something went wrong. Please try again.';
export const ugx=(value:number)=>`UGX ${new Intl.NumberFormat('en-UG').format(Number(value)||0)}`;
