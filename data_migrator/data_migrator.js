const https = require('https');
const url = require('url');
const fs = require('fs');

function workPool(jobs, poolSize) {
    return new Promise((resolve) => {
        var numJobsRunning = 0;

        function pickJob() {
            if (jobs.length == 0 || numJobsRunning >= poolSize) {
                return false;
            }

            function onJobFinish() {
                // console.log(`workPool->onJobFinish: ${jobs.length}/${numJobsRunning}`);
                numJobsRunning -= 1;
                if (!pickJob()) {
                    if (numJobsRunning == 0 && jobs.length == 0) {
                        resolve();
                    }
                }
            }

            var jobStub = jobs.shift();
            numJobsRunning += 1;
            var job = jobStub();
            job.then(onJobFinish, onJobFinish);
            // console.log(`workPool->add: ${jobs.length}/${numJobsRunning}`);
            return true;
        }

        while (pickJob()) { // eslint-disable-line no-empty

        }
    });
}

async function downloadFoodRepo() { // eslint-disable-line no-unused-vars
    async function fetchPage(pageUrl) {
        let parsedUrl = url.parse(pageUrl);
        return new Promise((resolve) => {
            console.log(pageUrl);
            https.get(
                {
                    hostname: parsedUrl.hostname,
                    path: parsedUrl.path,
                    port: 443,
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': 'Token token=d81586ea4db31c3c471036ab633ef2fe'
                    }
                },
                (res) => {
                    if (res.statusCode != 200) {
                        resolve(null);
                        return;
                    }

                    let data = '';
                    res.on('data', (chunk) => {
                        data += chunk;
                    });
                    res.on('end', () => {
                        let json = JSON.parse(data);

                        let products = json.data;

                        for (const product of products) {
                            fs.writeFileSync(`./dataset/${product.id}.json`, JSON.stringify(product));
                        }

                        let nextPage = json.links.next;
                        resolve(nextPage);
                    });
                    res.on('error', (e) => {
                        console.error(`Got error: ${e.message}`);
                        resolve(null);
                    });
                });
        });
    }

    let nextPage = 'https://www.foodrepo.org/api/v3/products?page%5Bsize%5D=200&page%5Bnumber%5D=0';
    while (nextPage) {
        nextPage = await fetchPage(nextPage);
    }
}

async function uploadToAmbrosus() { // eslint-disable-line no-unused-vars
    let files = fs.readdirSync('./dataset');

    async function uploadByFilename(filename) {
        return new Promise((resolve) => {
            let product = JSON.parse(fs.readFileSync(`./dataset/${filename}`));
            delete product.created_at;
            delete product.updated_at;
            delete product.status;
            let asset = {
                'content': {
                    'secret': ambrosusUser.secret,
                    'data': {
                        'owner': ambrosusUser.address,
                        'creator': ambrosusUser.address,
                        'created_at': Date.now(),
                        'name': product.display_name_translations.en,
                        'identifiers': {
                            'barcode': product.barcode
                        },
                        ...product
                    }
                }
            };

            const req = https.request(
                {
                    'method': 'POST',
                    'hostname': 'network.ambrosus.com',
                    'path': '/assets',
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
                        console.log(`end: ${filename}`);
                        try {
                            var body = Buffer.concat(chunks);
                            let createdAsset = JSON.parse(body);
                            console.log(`${filename} -> ${createdAsset.id}`);
                        } catch (err) {
                            console.log(`${filename} -> ${err}`);
                        } finally {
                            resolve();
                        }
                    });
                });

            req.on('error', (err) => {
                console.log(`${filename} -> ${err}`);
                resolve();
            });

            req.write(JSON.stringify(asset));
            req.end();
        });
    }

    let jobs = files.map((filename) => {
        return () => uploadByFilename(filename);
    });

    await workPool(jobs, 10);
    // await uploadByFilename('10027.json');
}

async function main() {
    // await downloadFoodRepo();
    await uploadToAmbrosus();
}

main()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));