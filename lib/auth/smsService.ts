import twilio from 'twilio';

export async function sendSmsOtp(toPhoneNumber: string, otp: string): Promise<{ success: boolean; deliveredLive: boolean; error?: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  // 1. Try Twilio SMS Gateway if credentials are set
  if (accountSid && authToken && fromNumber) {
    try {
      const client = twilio(accountSid, authToken);
      const message = await client.messages.create({
        body: `Your Jiya verification code is: ${otp}. Valid for 5 minutes. Do not share this code with anyone.`,
        from: fromNumber,
        to: toPhoneNumber,
      });

      console.log(`[TWILIO SMS SUCCESS] Message SID: ${message.sid} dispatched to ${toPhoneNumber}`);
      return { success: true, deliveredLive: true };
    } catch (error: any) {
      console.error('[TWILIO SMS FAILURE]', error?.message || error);
    }
  }

  // 2. Try Textbelt Free Live SMS Gateway Dispatcher
  try {
    const textbeltRes = await fetch('https://textbelt.com/text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: toPhoneNumber,
        message: `Your Jiya verification code is: ${otp}. Valid for 5 minutes.`,
        key: 'textbelt', // Free tier key
      }),
    });

    const textbeltData = await textbeltRes.json();
    if (textbeltData.success) {
      console.log(`[TEXTBELT SMS SUCCESS] Free SMS dispatched to ${toPhoneNumber}`);
      return { success: true, deliveredLive: true };
    } else {
      console.log(`[TEXTBELT SMS NOTICE] ${textbeltData.quotaRemaining === 0 ? 'Daily free SMS quota used.' : textbeltData.error}`);
    }
  } catch (err) {
    console.error('[TEXTBELT SMS ERROR]', err);
  }

  // 3. Fallback: Log OTP to server console & return for demo display
  console.log('\n======================================================');
  console.log(`📱 SMS OTP GENERATED FOR ${toPhoneNumber}`);
  console.log(`🔑 VERIFICATION CODE: [ ${otp} ]`);
  console.log('======================================================\n');

  return { success: true, deliveredLive: false };
}
