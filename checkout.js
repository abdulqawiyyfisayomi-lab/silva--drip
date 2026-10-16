(async()=>{
const form=document.getElementById('checkoutForm'), button=document.getElementById('payButton'), note=document.getElementById('checkoutNote'), summary=document.getElementById('summary');
try {
  const {data:{session}}=await silvaAuth.auth.getSession();
  if(!session) {location.replace('login_2.html?return='+encodeURIComponent(location.pathname+location.search));return;}
  const request=async(url,options={})=>{
    const response=await fetch(url,{...options,headers:{Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'}});
    const data=await response.json();if(!response.ok) throw new Error(data.error || 'Request failed.');return data;
  };
  let cart;try {cart=JSON.parse(localStorage.getItem('silvaCart') || '{}');} catch {cart={};}
  const reference=new URLSearchParams(location.search).get('reference');
  if(reference) {
    form.hidden=true;
    const verify=async()=>{
      note.textContent='Verifying your payment…';
      try {
        const result=await request('/api/verify-payment?reference='+encodeURIComponent(reference));
        if(result.paid && sessionStorage.getItem('silva-order-'+reference)) {
          const snapshot=sessionStorage.getItem('silva-order-'+reference);
          if(localStorage.getItem('silvaCart')===snapshot) localStorage.removeItem('silvaCart');
          sessionStorage.removeItem('silva-order-'+reference);
        }
        note.textContent=result.paid ? 'Payment confirmed. Your order reference is '+result.reference+'. Keep this reference for delivery enquiries.' : 'Payment has not been confirmed yet. If you have paid, check again shortly.';
      } catch(error) {note.textContent=error.message;}
    };
    const retry=document.createElement('button');retry.textContent='Check payment again';retry.onclick=verify;summary.append(retry);await verify();return;
  }
  const response=await fetch('/server/catalog.json');if(!response.ok) throw new Error('Unable to load prices.');
  const catalog=await response.json();let amount=0;const items=[];
  for(const [id,quantity] of Object.entries(cart)) {
    const p=catalog.find(p=>p.id===Number(id));
    if(!p || !Number.isInteger(quantity) || quantity<1 || quantity>20) throw new Error('Your cart needs updating. Return to the shop.');
    const item={id:p.id,quantity,size:p.cat==='Accessories'?'One size':'M'};items.push(item);
    const label=document.createElement('label');label.textContent=p.name+' size ';
    const select=document.createElement('select');
    for(const size of (p.cat==='Accessories'?['One size']:['S','M','L','XL','XXL'])) {const option=document.createElement('option');option.value=size;option.textContent=size;option.selected=size===item.size;select.append(option);}
    select.onchange=()=>item.size=select.value;label.append(select);summary.append(label);amount+=p.price*quantity;
    const line=document.createElement('p');line.textContent=p.name+' × '+quantity+' — ₦'+(p.price*quantity/100).toLocaleString();summary.append(line);
  }
  if(!items.length) throw new Error('Your cart is empty. Return to the shop.');
  const total=document.createElement('h2');total.textContent='Total: ₦'+(amount/100).toLocaleString();summary.append(total);
  note.textContent='Signed in as '+session.user.email;button.disabled=false;
  form.addEventListener('submit',async event=>{
    event.preventDefault();button.disabled=true;note.textContent='Opening secure payment…';
    try {const result=await request('/api/checkout',{method:'POST',body:JSON.stringify({items,shipping:Object.fromEntries(new FormData(form))})});sessionStorage.setItem('silva-order-'+result.reference, JSON.stringify(cart));location.assign(result.url);}
    catch(error) {note.textContent=error.message;button.disabled=false;}
  });
} catch(error) {note.textContent=error.message;button.disabled=true;}
})();
