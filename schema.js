const Joi = require('joi');

const bookSchema = Joi.object({
    book:Joi.object({
        title:Joi.string().required(),
        author:Joi.string().required(),
        publisher:Joi.string().required(),
        genre:Joi.string().required(),
        language:Joi.string().required(),
        year:Joi.number()
                .min(1500)
                .max(2024)
                .required(),
        isbn:Joi.number()
                .min(1000000000)
                .required(),
        quantity:Joi.string()
                    .min(0)
                    .required(),
        borrow_count:Joi.string()
                        .min(0)
                        .required(),
        rack:Joi.number()
                .min(0),
        shelf:Joi.number()
                 .min(0),
        image:Joi.string(),
    }).required()
});

const userSchema = Joi.object({
        user:Joi.object({
                name: Joi.string()
                        .uppercase()
                        .required(),
                gender: Joi.string()
                        .uppercase()
                        .valid("MALE", "FEMALE", "OTHER") // Optionally validate specific values
                        .required(),
                dob: Joi.date()
                        .less('now') // Ensure the date is in the past
                        .required(),
                contact: Joi.number()
                        .integer()
                        .min(1000000000) // At least 10 digits
                        .max(9999999999) // Max 10 digits (optional, for phone number validation)
                        .required(),
                address: Joi.string()
                        .required(),
                emailId: Joi.string()
                        .email()
                        .required(),
        }).required()
});


module.exports={bookSchema,userSchema};