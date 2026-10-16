import {randomUUID} from 'node:crypto';
import {settings,user,orderItems,total,database,paystack} from '../server/payments.js';
export default async function handler(req,res) {
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  try {
    const account=await user(req);
    const body=typeof req.body==='string'?JSON.parse(req.body):req.body;
    const items=orderItems(body.items);
    const shipping={};
    for(const field of ['name','phone','address','city','state']) {
      const value=body.shipping?.[field];
      if(typeof value!=='string' || !value.trim() || value.length>(field==='address'?1000:120)) throw new Error('Please complete your delivery details.');
      shipping[field]=value.trim();
    }
    const reference='silva-'+randomUUID(), amount=total(items);
    await database('orders',{method:'POST',body:JSON.stringify({reference,user_id:account.id,email:account.email,amount,items,shipping,status:'pending'})});
    const payment=await paystack('transaction/initialize',{reference,amount,email:account.email,currency:'NGN',callback_url:settings().site+'/checkout.html',metadata:{order_reference:reference}});
    return res.json({url:payment.authorization_url,reference});
  } catch(error) {return res.status(400).json({error:error.message});}
}
