const functions = require('firebase-functions'); 
const admin = require('firebase-admin'); 
admin.initializeApp(); 
// const logging = require('@google-cloud/logging')();
const stripe = require('stripe')('sk_test_03keKEvzEQkLMwegjjqG5i8n00MFIzSWzB')   
const currency = 'usd';

// [START chargecustomer]
// Charge the Stripe customer whenever an amount is written to the Realtime database
exports.createStripeCharge = functions.firestore.document('stripe_customers/{userId}/charges/{id}').onCreate(async (snap, context) => {
      const val = snap.data();
      try {
        // Look up the Stripe customer id written in createStripeCustomer
        const snapshot = await admin.firestore().collection(`stripe_customers`).doc(context.params.userId).get()
        const snapval = snapshot.data();
        const customer = snapval.customer_id
        // Create a charge using the pushId as the idempotency key
        // protecting against double charges
        const amount = val.amount;
        const idempotencyKey = context.params.id;
        const charge = {amount, currency, customer};
        if (val.source !== null) {
          charge.source = val.source;
        }
        const response = await stripe.charges.create(charge, {idempotency_key: idempotencyKey});
        // If the result is successful, write it back to the database
        return snap.ref.set(response, { merge: true });
      } catch(error) {
        // We want to capture errors and render them in a user-friendly way, while
        // still logging an exception with StackDriver
        console.log(error);
        // await snap.ref.set({error: userFacingMessage(error)}, { merge: true });
        // return reportError(error, {user: context.params.userId});
      }
    });

exports.createStripeCustomer = functions.auth.user().onCreate(async (user) => { 
  //await - stops functioning from continuing to run while waiting for data
    const customer = await stripe.customers.create({email: user.email}); 
    return admin.firestore().collection('stripe_customers').doc(user.uid).set({customer_id: customer.id});
  });
  
// Add a payment source (card) for a user by writing a stripe payment source token to Realtime database
exports.addPaymentSource = functions.firestore.document('/stripe_customers/{userId}/tokens/{pushId}').onCreate(async (snap, context) => {
  const source = snap.data();  
  console.log(context)
  const token = context.params.pushId; 
  console.log(token)
  if (source === null){
    return null;
  }

  try {
    const snapshot = await admin.firestore().collection('stripe_customers').doc(context.params.userId).get(); 
    const customer =  snapshot.data().customer_id; 
    console.log(customer) 
    const response = await stripe.customers.createSource(customer, {source: token}); 
    return admin.firestore().collection('stripe_customers').doc(context.params.userId).collection("sources").doc(response.fingerprint).set(response, {merge: true});
  } catch (error) {
    console.log(error)
  }
});