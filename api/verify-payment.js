import {user,database,settle} from '../server/payments.js';
export default async function handler(req,res) {
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='GET') return res.status(405).json({error:'Method not allowed'});
  try {
    const account=await user(req), reference=req.query.reference;
    if(typeof reference!=='string' || !/^silva-[a-f0-9-]{36}$/.test(reference)) throw new Error('Invalid order reference.');
    const orders=await database('orders?reference=eq.'+encodeURIComponent(reference)+'&user_id=eq.'+encodeURIComponent(account.id));
    if(!orders.length) throw new Error('Order not found for this account.');
    return res.json(await settle(orders[0]));
  } catch(error) {return res.status(400).json({error:error.message});}
}
