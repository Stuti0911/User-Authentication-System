





const sendMail =async ()=>{
    try {
        await transporter.sendMail(mailOptions)
        console.log('Email sent: ' + info.response);
    } catch (error) {
        console.log('Error occurred: ' + error.message);
    }
}

export {transporter}