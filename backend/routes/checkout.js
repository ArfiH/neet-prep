const express = require('express');
const router = express.Router();

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>NEET Zymee - Payment</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;display:flex;align-items:center;justify-content:center;min-height:100vh;color:#333}
.l{text-align:center;padding:40px}
.s{width:40px;height:40px;border:4px solid #e0e0e0;border-top-color:#2ea86e;border-radius:50%;animation:a .8s linear infinite;margin:0 auto 20px}
@keyframes a{to{transform:rotate(360deg)}}
.l p{font-size:15px;color:#666}
</style>
</head>
<body>
<div class="l"><div class="s"></div><p>Opening payment window...</p></div>
<script src="https://checkout.razorpay.com/v1/checkout.js"><\/script>
<script>
try{
var p=new URLSearchParams(window.location.search);
var keyId=p.get('key_id');
var orderId=p.get('order_id');
var cb=p.get('callback_url');
var pe=p.get('prefill_email')||'';
var pn=p.get('prefill_name')||'';
function go(u){window.location.href=u}
function ap(u,q){return u+(u.indexOf('?')>-1?'&':'?')+q}
var opts={
key:keyId,
order_id:orderId,
name:'NEET Zymee',
prefill:{email:pe,name:pn},
handler:function(r){go(ap(cb,'razorpay_payment_id='+encodeURIComponent(r.razorpay_payment_id)+'&razorpay_order_id='+encodeURIComponent(r.razorpay_order_id)+'&razorpay_signature='+encodeURIComponent(r.razorpay_signature)))},
modal:{ondismiss:function(){go(ap(cb,'error=cancelled'))}},
theme:{color:'#2ea86e'}
};
var rzp=new Razorpay(opts);
rzp.on('payment.failed',function(r){
var e=r&&r.error;
var m=e&&e.metadata;
go(ap(cb,'razorpay_payment_id='+encodeURIComponent(m&&m.payment_id||'')+'&razorpay_order_id='+encodeURIComponent(m&&m.order_id||'')+'&error[code]='+encodeURIComponent(e&&e.code||'')+'&error[description]='+encodeURIComponent(e&&e.description||'Payment failed')))
});
rzp.open();
}catch(e){go(ap(cb,'error='+encodeURIComponent(e&&e.message||'Failed to initialize payment')))}
<\/script>
</body>
</html>`;

router.get('/', (req, res) => {
  const { key_id, order_id } = req.query;
  if (!key_id || !order_id) {
    return res.status(400).json({ error: 'key_id and order_id are required' });
  }
  res.type('html').send(HTML);
});

module.exports = router;
