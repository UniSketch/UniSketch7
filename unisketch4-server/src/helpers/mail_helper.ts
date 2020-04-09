import {Transporter} from "nodemailer";
import {User} from "../models/User";
import * as Express from 'express';

const nodemailer = require('nodemailer');


/**
 * Helper class for the sending of emails.
 */
class MailHelper {

    private config: any;
    private transporter: Transporter;

    /**
     * Sets up the mail helper with the configured mail server settings from config.json.
     * By default, the 'development' section will be loaded unless the NODE_ENV environment variable is set to something else.
     */
    constructor() {
        this.config = require('../config/config.json')[process.env.NODE_ENV || 'development'];


        this.transporter = nodemailer.createTransport({
            host: this.config.mail_host,
            port: +this.config.mail_port,
            secure: false,
            proxy: this.config.mail_proxy,
            auth: {
                user: this.config.mail_user,
                pass: this.config.mail_password
            }
        });
    }

    /**
     * Sends a password reset email to the given user. The user is expected to already have password reset tokens set from the caller.
     */
    public sendPasswordReset(req: Express.Request, user: User) {
        let mailOptions = {
            from: this.config.mail_email,
            to: user.email_address,
            subject: 'Reset Password',
            text: 'Dear Unisketch user,\n\n' +
                'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
                'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                'http://' + req.headers.host + '/password_reset/' + user.password_reset_token + '\n\n' +
                'If you did not request this, please ignore this email and your password will remain unchanged.\n'
        };

        console.log("sending mail to " + user.email_address);
        return this.transporter.sendMail(mailOptions, (err, info) => {
            console.log(err, info);
        });
    }

}

export let mailHelper = new MailHelper();