window.silvaAuth = window.supabase.createClient(
  'https://zypnnutljumdewfblmuc.supabase.co',
  'sb_publishable_g1Qz6f-JHbsT1lhAUyKdAw_dLaDii4b'
);
// Remove passwords stored by the old demo.
localStorage.removeItem('silvaDripUsers');
localStorage.removeItem('silvaDripAuth');
