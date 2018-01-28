const https = require('https');

const ambrosusUser = { // eslint-disable-line no-unused-vars
    'secret': '0x0ef291d4eadef252bae867afa563f06d9d2c28c62c7da804f9cff72f1d42eefc',
    'address': '0xA09cBeA37214F834b8EEA987B0b22705E496d3eC',
};

class AmbrosusHelper {
    async makeRequest(method, endpoint, jsonBody) {
        return new Promise((resolve, reject) => {
            const req = https.request(
                {
                    'method': method,
                    'hostname': 'network.ambrosus.com',
                    'path': endpoint,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Cache-Control': 'no-cache',
                    }
                },
                function (res) {
                    var chunks = [];
    
                    res.on('data', function (chunk) {
                        chunks.push(chunk);
                    });
    
                    res.on('end', function () {
                        try {
                            var body = Buffer.concat(chunks);
                            let returnedJSON = JSON.parse(body);
                            resolve(returnedJSON);
                        } catch (err) {
                            reject(err);
                        }
                    });
                });
    
            req.on('error', (err) => {
                reject(err);
            });
    
            if (jsonBody) {
                req.write(JSON.stringify(jsonBody));
            }
            req.end();
        });
    }

    async getAssetByIdentifier(type, identifier) {        
        const assets = await this.makeRequest('GET', `/assets/find/${type}:${identifier}`);
        if (assets.length > 0) {
            return assets[0];
        } else {
            return null;
        }
    }

    async getEventsForAsset(assetId) {
        const events = await this.makeRequest('GET', `/assets/${assetId}/events`);
        return events;
    }
}

function ambrosusMidleware() {
    return (req, res, next) => {
        req.ambrosusHelper = new AmbrosusHelper();
        next();
    };
}

module.exports = { AmbrosusHelper, ambrosusMidleware };