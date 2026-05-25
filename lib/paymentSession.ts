export let paymentHandled = false;
export const markPaymentHandled = () => { paymentHandled = true; };
export const resetPaymentHandled = () => { paymentHandled = false; };