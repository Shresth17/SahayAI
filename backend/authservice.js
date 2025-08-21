const jwt = require('jsonwebtoken');

// Read JWT secret from environment. Do NOT hard-code secrets in source.
const secretkey = process.env.JWT_SECRET || 'change_this_in_dev';

function setUser(user){
    // Token expires in 2 hours by default
    const token = jwt.sign({user}, secretkey, { expiresIn: '2h' });
    return token;
}

function getUser(token){
    if(!token) return null;
    try {
        return jwt.verify(token, secretkey);
    } catch (err) {
        // Invalid or expired token
        return null;
    }
}

module.exports = {setUser,getUser};