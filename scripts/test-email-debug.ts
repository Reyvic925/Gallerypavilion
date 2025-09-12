import { testEmailConfig, sendPasswordResetEmail } from '../src/lib/email'

async function testEmails() {
  console.log('Environment variables check:')
  console.log('EMAIL_SERVER_HOST:', process.env.EMAIL_SERVER_HOST)
  console.log('EMAIL_SERVER_PORT:', process.env.EMAIL_SERVER_PORT)
  console.log('EMAIL_SERVER_USER:', process.env.EMAIL_SERVER_USER)
  console.log('EMAIL_SERVER_PASSWORD:', process.env.EMAIL_SERVER_PASSWORD ? '[PRESENT]' : '[MISSING]')
  console.log('EMAIL_FROM:', process.env.EMAIL_FROM)
  console.log('\nTesting email configuration...')
  
  try {
    const configTest = await testEmailConfig()
    
    if (!configTest.success) {
      console.error('Email configuration test failed:')
      return
    }
    
    console.log('Email configuration test passed!')
    
    console.log('\nAttempting to send test reset email...')
    await sendPasswordResetEmail('vameh09@gmail.com', 'http://localhost:3001/test-reset')
    console.log('Test reset email sent successfully!')
  } catch (error) {
    console.error('Test failed with error:', error)
  }
}

testEmails()
