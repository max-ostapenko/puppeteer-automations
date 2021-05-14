function sgSend(subject, text) {
  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  const msg = {
    to: 'bvz2001@gmail.com',
    from: 'max@maxostapenko.com',
    subject: subject,
    text: text,
    html: '<strong>and easy to do anywhere, even with Node.js</strong>',
  };

  (async () => {
    try {
      await sgMail.send(msg);
    } catch (error) {
      console.error(error);

      if (error.response) {
        console.error(error.response.body);
      }
    }
  })();
}

module.exports = sgSend;
