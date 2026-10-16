import {readFileSync} from 'node:fs';
export const catalog = JSON.parse(readFileSync(new URL('./catalog.json', import.meta.url)));
export function orderItems(items) {
  if(!Array.isArray(items) || !items.length || items.length>34) throw new Error('Choose between 1 and 34 products.');
  const seen = new Set();
  return items.map(item=>{
    const p = catalog.find(p=>p.id===item.id);
    if(!p || seen.has(item.id) || !Number.isInteger(item.quantity) || item.quantity<1 || item.quantity>20) throw new Error('Invalid cart. Return to the shop and try again.');
    const sizes=p.cat==='Accessories'?['One size']:['S','M','L','XL','XXL'];
    if(!sizes.includes(item.size)) throw new Error('Choose a valid size for each item.');
    seen.add(item.id);
    return {id:p.id,name:p.name,size:item.size,quantity:item.quantity,unit_amount:p.price};
  });
}
export function total(items) {return items.reduce((sum,i)=>sum+i.quantity*i.unit_amount,0);}
export function settings() {
  const {SUPABASE_SERVICE_ROLE_KEY, PAYSTACK_SECRET_KEY, SITE_URL} = process.env;
  if(!SUPABASE_SERVICE_ROLE_KEY || !PAYSTACK_SECRET_KEY || !SITE_URL) throw new Error('Checkout is not configured yet. Please contact the store.');
  return {key:SUPABASE_SERVICE_ROLE_KEY, payKey:PAYSTACK_SECRET_KEY, site:new URL(SITE_URL).origin, url:'https://zypnnutljumdewfblmuc.supabase.co'};
}
export async function database(path, options={}) {
  const s=settings();
  const r=await fetch(s.url+'/rest/v1/'+path,{...options,headers:{apikey:s.key,Authorization:'Bearer '+s.key,'Content-Type':'application/json',Prefer:'return=representation',...options.headers}});
  if(!r.ok) throw new Error('Unable to save or retrieve your order. Please try again.');
  return r.status===204 ? null : r.json();
}
export async function user(req) {
  const s=settings(); const token=req.headers.authorization;
  if(!token?.startsWith('Bearer ')) throw new Error('Please sign in to continue.');
  const r=await fetch(s.url+'/auth/v1/user',{headers:{apikey:s.key,Authorization:token}});
  if(!r.ok) throw new Error('Please sign in again.');
  return r.json();
}
export async function paystack(path, body) {
  const r=await fetch('https://api.paystack.co/'+path,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+settings().payKey,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
  const j=await r.json();
  if(!r.ok || !j.status) throw new Error('Payment service unavailable. Please try again.');
  return j.data;
}
export function matchesPayment(order, payment) {
  return payment.status==='success' && payment.reference===order.reference && payment.amount===order.amount && payment.currency==='NGN' && payment.customer?.email?.toLowerCase()===order.email.toLowerCase();
}
export async function settle(order) {
  const payment=await paystack('transaction/verify/'+encodeURIComponent(order.reference));
  if(!matchesPayment(order,payment)) return {paid:false,reference:order.reference};
  await database('orders?reference=eq.'+encodeURIComponent(order.reference),{method:'PATCH',body:JSON.stringify({status:'paid',paid_at:payment.paid_at || new Date().toISOString()})});
  return {paid:true,reference:order.reference};
}
