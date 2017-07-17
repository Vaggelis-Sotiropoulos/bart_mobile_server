var accountSid = 'AC1d5d92507963b3bad165e03a8f7cb211';
var authToken = 'c9f5d8ccc403f91d45a9c72ea80b8bfd';

var twilio = require('twilio');
var client = new twilio(accountSid, authToken);
var axios = require('axios');

let phoneNumbers = [];
let bsa = 'No delays reported.'

setInterval(() => getBSA(), 15000);

//if BSA (BART Service Adivsory) is different, then send the update to all phone numbers stored in the DB 
let getBSA = () => {
  axios.get('http://localhost:1337/api/advisory')
  .then( res => {
    if(bsa !== res.data.root.bsa.sms_text) {
      bsa = res.data.root.bsa.sms_text;
      sendUpdate();
    }
  })
  .catch(err => console.log(`Error: ${err}`))
}

let extractPhoneNumbers = (data) => {
  return data.map( entry => entry.phone);
}

let textUsers = (phones) => {
  for (let i = 0; i < phones.length; i++) {
    client.messages.create({
      body: `[Bart Buddy]: ${bsa}`,
      to: phones[i],  // Text this number
      from: '+15109013127' // From a valid Twilio number
    })
    .then((message) => console.log(message.sid));    
   }
}

let sendUpdate = () => {
  return axios.get('http://localhost:1337/retrieve')
  .then( res => {
    phoneNumbers = extractPhoneNumbers(res.data)
    textUsers(phoneNumbers);
  })
  .catch(err => console.log(`twilio.js failure: ${err}`) )
}