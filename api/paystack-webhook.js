import {createHmac,timingSafeEqual} from 'node:crypto';
import {settings,database,settle} from '../server/payments.js';
export const config={api:{bodyParser:false}};
export default async function handler(req,res) {
  if(req.method!=='POST') return res.status(405).end();
  try {
    const chunks=[];let size=0;
    for await(const chunk of req) {size+=chunk.length;if(size>1000000) return res.status(413).end();chunks.push(chunk);}
    const raw=Buffer.concat(chunks), signature=req.headers['x-paystack-signature'];
    const expected=createHmac('sha512',settings().payKey).update(raw).digest('hex');
    if(typeof signature!=='string' || signature.length!==expected.length || !timingSafeEqual(Buffer.from(signature),Buffer.from(expected))) return res.status(401).end();
    const event=JSON.parse(raw.toString());
    if(event.event==='charge.success' && typeof event.data?.reference==='string') {
      const orders=await database('orders?reference=eq.'+encodeURIComponent(event.data.reference));
      if(orders.length) await settle(orders[0]);
    }
    return res.status(200).json({received:true});
  } catch {return res.status(500).json({error:'Unable to process payment notification.'});}
}
