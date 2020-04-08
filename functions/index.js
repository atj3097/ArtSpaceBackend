const functions = require('firebase-functions'); 
const admin = require('firebase-admin'); 
admin.initializeApp(); 
// const logging = require('@google-cloud/logging')();
const stripe = require('stripe')('sk_test_03keKEvzEQkLMwegjjqG5i8n00MFIzSWzB');

exports.createStripeCustomer = functions.auth.user().onCreate(async (user) => {
    const customer = await stripe.customers.create({email: user.email});
    return admin.firestore().collection('stripe_customers').doc(user.uid).set({customer_id: customer.id});
  });
  
