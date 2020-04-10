const functions = require('firebase-functions'); 
const admin = require('firebase-admin'); 
admin.initializeApp(); 
// const logging = require('@google-cloud/logging')();
const stripe = require('stripe')('sk_test_03keKEvzEQkLMwegjjqG5i8n00MFIzSWzB') 

exports.createStripeCustomer = functions.auth.user().onCreate(async (user) => { 
  //await - stops functioning from continuing to run while waiting for data
    const customer = await stripe.customers.create({email: user.email}); 
    return admin.firestore().collection('stripe_customers').doc(user.uid).set({customer_id: customer.id});
  });
  
  exports.addPaymentSource = functions.firestore.document('/stripe_customers/{userId}/tokens/{pushId}').onCreate(async (snap, context) => {
    const source = snap.data();
    const token = source.token;
    if (source === null){
      return null;
    }
  
    try {
      const snapshot = await admin.firestore().collection('stripe_customers').doc(context.params.userId).get(); 
      console.log('Getting documents');
      const customer =  snapshot.data().customer_id; 
      console.log(token.id)
      const response = await stripe.customers.createSource(customer, {source: token}); 
      //Setting the source  
      console.log('Payment Set in Stripe');
      return admin.firestore().collection('stripe_customers').doc(context.params.userId).collection("sources").doc(response.fingerprint).set(response, {merge: true});
    } catch (error) {
      // await snap.ref.set({'error':userFacingMessage(error)},{merge:true});
      // return reportError(error, {user: context.params.userId}); 
      return error;
    }
  }); 
  // function reportError(err, context = {}) {
  //   // This is the name of the StackDriver log stream that will receive the log
  //   // entry. This name can be any valid log stream name, but must contain "err"
  //   // in order for the error to be picked up by StackDriver Error Reporting.
  //   const logName = 'errors';
  //   const log = logging.log(logName);
  
  //   // https://cloud.google.com/logging/docs/api/ref_v2beta1/rest/v2beta1/MonitoredResource
  //   const metadata = {
  //     resource: {
  //       type: 'cloud_function',
  //       labels: {function_name: process.env.FUNCTION_NAME},
  //     },
  //   };
  
  //   // https://cloud.google.com/error-reporting/reference/rest/v1beta1/ErrorEvent
  //   const errorEvent = {
  //     message: err.stack,
  //     serviceContext: {
  //       service: process.env.FUNCTION_NAME,
  //       resourceType: 'cloud_function',
  //     },
  //     context: context,
  //   };
  
  //   // Write the error log entry
  //   return new Promise((resolve, reject) => {
  //     log.write(log.entry(metadata, errorEvent), (error) => {
  //       if (error) {
  //        return reject(error);
  //       }
  //       return resolve();
  //     });
  //   });
  // } 

  // function userFacingMessage(error) {
  //   return error.type ? error.message : 'An error occurred, developers have been alerted';
  // }