const keys = require("../../keys");
const Models = require("../../models");

const validate = async (artifacts, request, h) => {
    
    const data = await Models.User.findOne({
        where: { id: artifacts.decoded.payload.user?.id }
    })
    
    if (Object.keys(data).length > 0) {
        return {
            isValid: true,
            credentials: { user: data.toJSON() }
        };
    } else {
        return {
            isValid: false
        }
    }

}

const jwtStrategy = (app) => {

    app.auth.strategy('jwt_token', 'jwt', {
        keys: keys.JWT_SECRET_KEY,
        verify: {
            aud: false,
            iss: false,
            sub: false,
            nbf: true,
            exp: true,
            maxAgeSec: 86400, // 24 hours
            timeSkewSec: 15
        },
        validate: validate
    });

    app.auth.default('jwt_token');
}

module.exports = jwtStrategy